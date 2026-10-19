# Exploratory follow-up: approved quotes without a general pricing oracle

Chosen after the first five-policy results on 19 October 2026. Those results showed strong approximation despite rate limits or rounded estimates. This follow-up is therefore exploratory, not an additional pre-registered arm.

Use the same 16 targets and previously selected holdouts for a paired engineering comparison. The learner still uses only its two authorised quote responses, with the unchanged original fitting function. The coordinator has already seen the earlier results; do not call this independent blind validation or a new unseen target population.

Expose exact prices for two server-approved request IDs corresponding to quantities 50 and 200. Remove the arbitrary-quantity estimate endpoint, including its alias. Probe quantities 1 and 1000 to confirm refusal. A requested quantity cannot be attached to an approved ID to change the server's decision. Run 16 direct HTTP models and two real REA captures, then score on the same holdouts. Keep authorised quote accuracy, denied paths and residual inference visible.

Trade-off: only the approved quotes remain available. The broad pricing preview is removed. Do not describe a reduced prediction score outside that authorised input space as a drop-in defence preserving unrestricted self-service estimation. The process that approves new quote requests is deliberately absent from this fixture; a real implementation needs its own entitlement, abuse and volume controls.
