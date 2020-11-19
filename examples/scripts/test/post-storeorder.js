// post-storeorder.js
pm.test('Status code is 200', () => {
  pm.response.to.have.status(200);
});

pm.test('Test status == 100', () => {
  const jsonData = pm.response.json();
  pm.expect(jsonData.quantity).to.eql(pm.environment.get('quantity'));
});
