// Deliberate IP exposure fixture. Do NOT use this pattern in a real SaaS product.
const INTERNAL_PRICING_RULES = {
  baseUnitPrice: 24,
  volumeBands: [
    { minQuantity: 100, discount: 0.12, rule: 'CORP_VOLUME_100' },
    { minQuantity: 50, discount: 0.08, rule: 'CORP_VOLUME_50' },
    { minQuantity: 1, discount: 0.02, rule: 'BASE_ACCOUNT' }
  ]
};
const calculateInBrowser = (qty) => {
  const band = INTERNAL_PRICING_RULES.volumeBands.find(b => qty >= b.minQuantity);
  return Math.round(qty * INTERNAL_PRICING_RULES.baseUnitPrice * (1 - band.discount) * 100) / 100;
};
document.getElementById('quote').addEventListener('click', async () => {
  const quantity = Number(document.getElementById('quantity').value);
  const clientTotal = calculateInBrowser(quantity);
  const reply = await fetch('/api/quotes', {
    method:'POST', headers: {'Content-Type':'application/json','Authorization':'Bearer demo-A'},
    body:JSON.stringify({productId:'widget', quantity, clientTotal, tenantId:'tenant-A'})
  });
  document.getElementById('result').textContent = JSON.stringify(await reply.json(),null,2);
});
//# sourceMappingURL=/assets/app.js.map
