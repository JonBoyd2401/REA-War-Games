# Workflow closure and indistinguishable private rules

Prospective plan, 19 October 2026. This is a new synthetic boundary experiment,
designed after the reconstruction studies. It is not an independent blind attack.

Question: can an entitled observer obtain unapproved prices by pooling sessions,
using an export, submitting a job, or creating its own approval?

Two private pricing worlds have identical supported quotes at quantities 50 and
200. World A changes its unit price from 2500 to 1500 cents at quantity 75; world
B changes at 175. Both change to 1000 cents at 400. Domain: integers 1..1000.
They disagree at every quantity 75..174. The server authorises request IDs that
it maps to quantities; the client cannot supply quantities to the quote, export
or job routes. Job results are re-authorised at read time. Approval creation is
denied to study principals. No world selector or rule is sent to the browser.

Measure all 1000 fabricated request IDs and all 1000 extra quantity fields on
all three output routes in both worlds. Check the two legitimate quotes through
all three routes and five sessions (two users, a service identity, another tenant,
and a replacement session); check foreign job reads and revocation. Exercise
concurrent approval requests and concurrent job creation. These tests concern a
single Node process only, with in-memory state and pre-provisioned identities.

Use real REA capture-browser-scenario on both worlds in three modes: closed,
deliberately leaking export, deliberately self-service approval. The browser
probe performs the same bounded requests in each mode. Verify response bodies
against recorded DOM results. REA records the experiment; it is not an autonomous
reconstruction agent. Keep incomplete capture flags and all failures visible.

Publish a conditional identifiability calculation, not a measured attacker score:
if the observer sees only equal permitted payloads, has no other information and
the two worlds are equally likely, exact prediction at a disputed input is at
most 50% on average over worlds. The all-domain ceiling is 95%, because 900 of
1000 outputs already agree. Timing, headers, transport, prior knowledge, external
datasets, vulnerabilities and new entitlements are outside this calculation.
Exhaustively verify domain agreement and payload equivalence. Do not claim that
finite tests establish absence of every side channel or prevent UI cloning.

Success: legitimate quotes stay exact; fabricated IDs and extra quantities never
release values in the closed fixture; sessions and routes share the boundary;
negative controls release the hidden value; actual REA captures preserve this
distinction. Freeze plan and implementation hashes before the measurement run.
