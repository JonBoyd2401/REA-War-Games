// Presentation only. No pricing rules, thresholds or tenant authorisation decisions.
document.getElementById('quote').addEventListener('click', async () => {
  const quantity = Number(document.getElementById('quantity').value);
  const reply = await fetch('/api/quotes', {
    method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization':'Bearer demo-A' },
    body: JSON.stringify({ productId:'widget', quantity })
  });
  document.getElementById('result').textContent = JSON.stringify(await reply.json(),null,2);
});
