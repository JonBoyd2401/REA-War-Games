document.querySelector('#run').addEventListener('click', async () => {
  const rows = [];
  async function request(route, body) {
    const response = await fetch(route, body === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const row = {route, request:body ?? null, status:response.status, body:await response.json()};
    rows.push(row); return row;
  }
  try {
    for (const requestId of ['approved-50','approved-200']) for (const route of ['/api/quote','/api/export','/api/jobs']) {
      const row = await request(route, {requestId});
      if (row.status === 202) await request('/api/jobs/' + row.body.jobId);
    }
    for (const route of ['/api/quote','/api/export','/api/jobs']) {
      await request(route, {requestId:'invented-100'});
      await request(route, {requestId:'approved-50', quantity:100});
    }
    await request('/api/export', {quantity:100});
    const approval = await request('/api/approvals', {quantity:100});
    if (approval.status === 201) await request('/api/quote', {requestId:approval.body.requestId});
    document.querySelector('#result').textContent = JSON.stringify({rows});
  } catch(error) {document.querySelector('#result').textContent = JSON.stringify({error:String(error), rows});}
});
