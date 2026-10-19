// Server-only demonstration rules. Do not bundle into browser assets.
export const INTERNAL_PRICING_RULES = Object.freeze({
  baseUnitPrice: 24,
  volumeBands: [
    { minQuantity: 100, discount: 0.12, rule: 'CORP_VOLUME_100' },
    { minQuantity: 50, discount: 0.08, rule: 'CORP_VOLUME_50' },
    { minQuantity: 1, discount: 0.02, rule: 'BASE_ACCOUNT' },
  ],
});
export function calculateQuote(quantity) {
  const band = INTERNAL_PRICING_RULES.volumeBands.find((x) => quantity >= x.minQuantity);
  const total = Math.round(quantity * INTERNAL_PRICING_RULES.baseUnitPrice * (1 - band.discount) * 100) / 100;
  return { total, ruleId: band.rule, threshold: band.minQuantity };
}
