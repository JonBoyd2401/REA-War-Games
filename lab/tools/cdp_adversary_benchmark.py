#!/usr/bin/env python3
"""Local, authorised Chrome DevTools inspection of vulnerable/hardened SaaS fixtures.

This is *not* REA. It replicates several relevant CDP observations as a
baseline until the upstream REA binary is installed on a supported machine.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"evidence"/"cdp_baseline"
OUT.mkdir(parents=True,exist_ok=True)
MODES={"unsafe":3000,"hardened":3001}


def request(method,url,body=None,token="demo-A",headers=None):
    data=json.dumps(body).encode() if body is not None else None
    h={"Authorization": f"Bearer {token}"}
    if body is not None:h["Content-Type"]="application/json"
    h.update(headers or {})
    req=Request(url,data=data,headers=h,method=method)
    try:
        with urlopen(req,timeout=6) as resp:
            raw=resp.read(); return {"status":resp.status,"data":raw.decode("utf-8",errors="replace")}
    except HTTPError as e:
        return {"status":e.code,"data":e.read().decode("utf-8",errors="replace")}


def wait_ready(port):
    for _ in range(100):
        try:
            with urlopen(f"http://127.0.0.1:{port}/",timeout=0.5) as r:
                if r.status==200:return
        except Exception: pass
        time.sleep(0.1)
    raise RuntimeError(f"app not ready on {port}")


def safe_json(s):
    try:return json.loads(s)
    except (TypeError,ValueError): return s


def run_one(mode,port,browser):
    base=f"http://127.0.0.1:{port}"
    ctx=browser.new_context()
    page=ctx.new_page()
    cdp=ctx.new_cdp_session(page)
    scripts={}
    net=[]
    response_events=[]
    bridged_requests=[]
    cdp.send("Page.enable")
    cdp.send("Debugger.enable")
    cdp.send("Network.enable")
    cdp.send("Profiler.enable")

    def on_script(event):
        scripts[event["scriptId"]]={"url":event.get("url"),"hash":event.get("hash"),"sourceMapURL":event.get("sourceMapURL"),"scriptId":event["scriptId"]}
    cdp.on("Debugger.scriptParsed",on_script)
    cdp.on("Network.requestWillBeSent",lambda event:net.append({
        "url":event["request"].get("url"),"method":event["request"].get("method"),
        "postData":event["request"].get("postData"),"initiator_type":event.get("initiator",{}).get("type"),
        "initiator_stack":event.get("initiator",{}).get("stack",{}).get("callFrames",[])[:5],
    }))
    page.on("response",lambda resp:response_events.append({"url":resp.url,"status":resp.status,"type":resp.request.resource_type}))

    # This environment administratively blocks browser navigation, including
    # loopback. Load the *actual* served JavaScript in a same-document fixture,
    # and bridge its fetch() requests to the real localhost API from Python.
    # V8/debugger observations are real; browser network initiators are NOT.
    script_body=request("GET",base+"/assets/app.js")["data"]
    def python_fetch(url,opts):
        path=url if url.startswith("http") else base+url
        b=safe_json(opts.get("body")) if opts.get("body") else None
        token=re.search(r"Bearer ([^ ]+)",opts.get("headers",{}).get("Authorization",""))
        bridged_requests.append({"url":path,"method":opts.get("method","GET"),"body":b})
        return safe_json(request(opts.get("method","GET"),path,body=b,token=token.group(1) if token else "demo-A")["data"])
    page.expose_function("pythonFetch",python_fetch)
    page.evaluate("window.fetch = async (url, opts={}) => ({ json: async () => await window.pythonFetch(url, opts) })")
    html=f"""<!doctype html><html><body><h1>{mode} fixture</h1><input id='quantity' type='number' value='50'/><button id='quote'>Quote</button><pre id='result'></pre><script>{script_body}\n//# sourceURL={base}/assets/app.js</script></body></html>"""
    page.set_content(html)
    page.wait_for_selector("#quote")

    # Collect Chrome Debugger-provided source, rather than guessing source from HTML.
    script_text=[]
    for script_id,meta in list(scripts.items()):
        try:
            src=cdp.send("Debugger.getScriptSource",{"scriptId":script_id}).get("scriptSource","")
        except Exception:continue
        if not meta.get("url","").startswith(base):continue
        script_text.append({"url":meta["url"],"bytes":len(src.encode()),
                            "sha256":hashlib.sha256(src.encode()).hexdigest(),
                            "contains_private_rules": "INTERNAL_PRICING_RULES" in src,
                            "contains_client_price": "clientTotal" in src,
                            "has_source_mapping_url": "sourceMappingURL" in src,
                            "source_excerpt":src[:1600]})

    # Identify listener type, location, URL without dispatching the callback.
    node=cdp.send("DOM.getDocument",{"depth":1})["root"]["nodeId"]
    button=cdp.send("DOM.querySelector",{"nodeId":node,"selector":"#quote"})["nodeId"]
    object_id=cdp.send("DOM.resolveNode",{"nodeId":button})["object"]["objectId"]
    listener_info=cdp.send("DOMDebugger.getEventListeners",{"objectId":object_id,"depth":0}).get("listeners",[])
    listener_info=[{"type":l.get("type"),"line":l.get("lineNumber"),"column":l.get("columnNumber"),
                    "scriptId":l.get("scriptId"),"url":l.get("url")} for l in listener_info]

    coverage_start=cdp.send("Profiler.startPreciseCoverage",{"callCount":True,"detailed":True,"allowTriggeredUpdates":False})
    page.locator("#quote").click()
    page.wait_for_function("document.querySelector('#result').textContent.trim().length > 0")
    coverage=cdp.send("Profiler.takePreciseCoverage")
    cdp.send("Profiler.stopPreciseCoverage")
    called=[]
    for entry in coverage.get("result",[]):
        if not entry.get("url","").startswith(base):continue
        functions=entry.get("functions",[])
        called.append({"url":entry.get("url"),"functions":len(functions),
                       "executed_function_ranges":sum(1 for fun in functions if any(r.get("count",0)>0 for r in fun.get("ranges",[]))),
                       "executed_blocks":sum(1 for fun in functions for r in fun.get("ranges",[]) if r.get("count",0)>0),
                       "unexecuted_blocks":sum(1 for fun in functions for r in fun.get("ranges",[]) if r.get("count",0)==0),
                       "isBlockCoverage":any(fun.get("isBlockCoverage") for fun in functions)})
    result=safe_json(page.locator("#result").inner_text())
    source_map=request("GET",f"{base}/assets/app.js.map")
    source_map_data=safe_json(source_map["data"])
    if isinstance(source_map_data,dict):
        map_detail={"status":source_map["status"],"original_source_names":source_map_data.get("sources",[]),
                    "original_source_content_retained":any(bool(t) for t in source_map_data.get("sourcesContent",[])),
                    "original_source_contains_proprietary_logic":any("INTERNAL_PRICING_RULES" in (t or "") for t in source_map_data.get("sourcesContent",[]))}
    else:map_detail={"status":source_map["status"]}

    # Five intentionally bounded customer queries: hardened mode allows four, then returns 429.
    # Use demo-B because the normal browser quote uses demo-A.
    samples=[]
    for qty in (1,49,50,100,101):
        res=request("POST",f"{base}/api/quotes",{"productId":"widget","quantity":qty},token="demo-B")
        b=safe_json(res["data"])
        if isinstance(b,dict):
            item={"quantity":qty,"http_status":res["status"],
                  "total":b.get("total"),"currency":b.get("currency"),
                  "ruleId":b.get("ruleId"),"threshold":b.get("threshold"),
                  "discountBands_exposed":"discountBands" in b}
            if res["status"]==201:item["implied_unit_price"]=round(b["total"]/qty,3)
            samples.append(item)
    stream=request("GET",f"{base}/api/events",token="demo-A")
    debug=request("GET",f"{base}/api/debug/rules")
    cdp.detach()
    ctx.close()
    summary={"mode":mode,"base":base,"method":"Chromium CDP in-memory script + real localhost API via Python bridge, NOT REA; browser navigation administratively blocked",
             "local_script_sources":script_text,"event_listeners":listener_info,
             "v8_precise_coverage":called,"source_map":map_detail,
             "browser_quote_result":result,
             "network_requests":[x for x in net if x["url"].startswith(base)],
             "network_responses":[x for x in response_events if x["url"].startswith(base)],
             "bridged_requests_NOT_real_browser_network":bridged_requests,
             "oracle_sampling":samples,"sse_event":{"status":stream["status"],"payload":stream["data"]},
             "debug_rule_endpoint":{"status":debug["status"],"payload":debug["data"][:1000]}}
    (OUT/f"{mode}_cdp_evidence.json").write_text(json.dumps(summary,indent=2))
    return summary


def main():
    processes=[]
    try:
        for mode,port in MODES.items():
            proc=subprocess.Popen(["node","server.mjs"],cwd=ROOT,env={**os.environ,"MODE":mode,"PORT":str(port)},stdout=subprocess.PIPE,stderr=subprocess.PIPE)
            processes.append(proc)
            wait_ready(port)
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
            results=[]
            for mode,port in MODES.items():results.append(run_one(mode,port,browser))
            browser.close()
        table=[]
        for x in results:
            table.append({"mode":x["mode"],"JS private rules exposed":any(s["contains_private_rules"] for s in x["local_script_sources"]),
                         "source map original content exposed":x["source_map"].get("original_source_content_retained",False),
                         "synthetic fetch bridge sends clientTotal":any("clientTotal" in (r.get("body") or {}) for r in x["bridged_requests_NOT_real_browser_network"]),
                         "real browser network bodies captured":False,
                         "quote response exposed ruleId":"ruleId" in x["browser_quote_result"],
                         "stream exposed ruleId":"ruleId" in x["sse_event"]["payload"],
                         "debug endpoint exposed":x["debug_rule_endpoint"]["status"]==200,
                         "observable pricing oracle responses":sum(1 for r in x["oracle_sampling"] if r["http_status"]==201),
                         "coverage events":sum(z["executed_blocks"] for z in x["v8_precise_coverage"]),
                         "listener count":len(x["event_listeners"])})
        (OUT/"comparison.json").write_text(json.dumps(table,indent=2))
        print(json.dumps(table,indent=2))
    finally:
        for p in processes:
            p.terminate()
            try:p.wait(timeout=4)
            except subprocess.TimeoutExpired:p.kill()

if __name__=='__main__':main()
