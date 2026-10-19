# Reconstruction experiment plan — 19 October 2026

Question: how well can a permitted client reconstruct an unseen synthetic pricing function from allowed responses, and what useful functionality is lost by reducing those responses?

This is a scripted, model-aware black-box study, not an independent AI red team, an OS-isolated blind study or a whole-product cloning benchmark. The learners are explicitly told the target family: three non-increasing integer unit-price bands on integer quantities 1–1000. Target thresholds and prices are not passed to the learner. This is deliberately a favourable attacker prior. Learning pricing alone does not reconstruct a SaaS product's workflows, integrations, data or infrastructure.

Freeze this plan and learner implementation before scoring. Generate 16 fresh synthetic targets with cryptographic randomness. For every target compare five policies, two learners (uniform sampling and adaptive interval sampling), and total request budgets 8, 24 and 64. Each model is frozen and hashed before unseen test quantities are selected. Score on a common set of 128 random quantities per target excluded from every learner's successful query inputs. Retain targets and holdouts as white-team evidence after prediction freezes. Programmatic separation is explicit; no filesystem-isolation claim is made.

Policies: exact minimal totals; exact totals with eight distinct quantities per tenant per day; totals rounded to GBP 1000; exact totals restricted to four server-approved catalogue quantities; rounded estimates plus exact quotes for two server-approved quote requests. Quantisation changes product precision. Catalogue restrictions change the supported input space. Neither is free protection. All endpoints enforce policy at the server.

Measure exact match, fraction within 1% and 5%, mean absolute GBP error and median percentage error. Report per-target distributions and best-of-two-learner results (a conservative assessment for defenders), not only a favourable average. Also report disclosure request count, successful distinct inputs, denied requests, public estimate error, and exact success for approved customer quote requests.

Run the larger numerical study through actual localhost HTTP. Separately run real REA browser captures for the adaptive learner at budget 24 on two targets for all five policies. Verify the browser transcript against retained network responses. Do not relabel the larger HTTP study as REA captures.

Negative controls: a per-session budget resets with a new session; the implemented tenant budget must survive two principals and endpoint aliases in one tenant; a new time window grants more queries; coarse estimates can still support an approximation. Test an unapproved quantity/request and a client-selected total. Normal approved quotes must still succeed where exact quotes are promised.

No promised outcome: publish weak effects, attack success, precision losses and model-specific limitations. Rounding and small budgets must not be described as universally blocking reconstruction.
