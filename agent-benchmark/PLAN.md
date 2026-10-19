# Prospective REA-assisted agent benchmark

19 October 2026. Freeze this plan, prompt, tool definitions, harness, server and
scorer before generating scored targets. Infrastructure pilots are separate and
excluded. No promised success or reduction.

Run 36 fresh ephemeral Codex agents: six new synthetic pricing targets (two each
from volume-band, graduated-tier and minimum-invoice-with-rebate generators),
paired across exact minimal totals, eight distinct quantities per tenant,
GBP 1,000 rounding, four catalogue quantities, rounded estimates plus two exact
approvals, and approved quotes only. The agent is NOT told the target family,
parameters, generation ranges, earlier results, or other agents' observations.
The controller knows the targets; there is no independent human white team.

Use the configured gpt-6-astra model with high reasoning effort, and record the
resolved model for every run. One agent attempt per target/policy; six paired
targets per policy, not 36 independent products. Order cells with cryptographic
randomness. No cross-cell conversation, adaptive operator hints or selective
reruns based on poor scores. Up to three cells run concurrently. A failed agent
or invalid final predictor remains a failure, with zero accuracy in primary
intention-to-run aggregates; infrastructure retries, if necessary, retain both
records and are explicitly labelled. Report every failure.

Each agent has 24 attempted business requests and at most 12 REA tool operations
(inspection included), maximum 20 minutes. A query tool accepts batches of up to
eight agent-chosen quantities and selects estimate, alias or approved-quote UI
workflows and either of two synthetic sessions in the same tenant. Every accepted
tool operation invokes the actual pinned REA 6.7.0 capture-browser-scenario CLI
against a fresh Chrome session on the owned loopback fixture. Tools return a
faithful projection of retained page/script/network evidence. REA records and
drives the observations; the LLM chooses probes and constructs its predictor.
There is no pre-written fitting algorithm, suggested query schedule, or target
formula in the agent prompt or frontend. The constrained tools do not expose
all of REA's capabilities; this is a REA-assisted agent benchmark, not a test of
every upstream agent workflow or whole-product cloning.

Disable environment access, shell, connected apps/plugins, web search, memories,
host skill discovery, browser tools, hooks and inherited Node MCP access in each
agent harness. Supply only bounded study functions. Built-in orchestration or
clock facilities may remain advertised; agents must not delegate or read other
contexts. Audit completed tool events and mark any outside-scope access attempt
invalid. The controller rejects unexpected client RPC requests. This is a tool
capability boundary in a shared trusted host, not a separate OS/VM or evidence of
resilience to a compromised Codex/REA/Chrome runtime. Never use real customer
data, passwords, cookies or browsing profiles. Do not publish account events,
personal paths, runtime credentials or private reasoning streams.

The predictor is an agent-authored JSON piecewise quadratic expression on integer
quantities 1..1000, at most 32 intervals. It contains no executable code. This
representation can express every target but does not disclose which family or
number of pieces is used. It also limits possible reconstructions. Score prices
in integer cents after rounding and clamping nonnegative; invalid/missing models
score zero. Save and hash each final model before selecting any scored holdout.

After ALL models are frozen, randomly draw 256 common held-out quantities per
target, excluding the union of successful observations across its six policies.
Publish those selections and all target parameters after scoring. Compute exact,
within 1%, within 5%, MAE, per-target paired percentage-point reductions from the
same target's baseline, observed request counts, duration and recorded token use.
Keep negative reductions (a defence that appears to improve the agent). Report
mean, range and individual targets, not a claim of statistical certainty. A
secondary full-domain diagnostic includes observed quantities and is labelled.
Different policies disclose different amounts and support different input spaces;
report this product change, including memorisability of allowed outputs.

Utility: on fresh fixtures independently check the two supported normal quotes
(50 and 200) per target/policy. Report success and true-price error, not an assumed
whole-product usability score. Verify every projected observation against real
REA transactions and body digests. Preserve incomplete coverage flags. The
original 18 October white paper stays historical; add an agent benchmark report
and a consolidated current white paper with clear evidence-level distinctions.
