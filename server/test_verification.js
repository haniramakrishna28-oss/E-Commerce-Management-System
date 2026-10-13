async function runComprehensiveTests() {
  const base = 'http://127.0.0.1:5000/api';
  console.log('--- STARTING COMPREHENSIVE E-COMMERCE SYSTEM VALIDATION ---\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await fetch(base + '/health').then(r => r.json());
    assert(health.status === 'online', 'Server health check returns online');

    // 2. Invalid Login Validation
    const invalidLogin = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@aura.store', password: 'WrongPassword!' }),
    });
    assert(invalidLogin.status === 401, 'Invalid credentials rejected with 401');

    // 3. Invalid Registration Validation (short password)
    const invalidReg = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shorty', email: 'short@test.com', password: '123' }),
    });
    assert(invalidReg.status === 400, 'Short password rejected with 400 validation error');

    // 4. Valid Admin & Customer Logins
    const adminLogin = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aura.store', password: 'Admin123!' }),
    }).then(r => r.json());
    assert(adminLogin.isAdmin === true && !!adminLogin.token, 'Admin logged in with valid JWT');

    const userLogin = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@aura.store', password: 'User123!' }),
    }).then(r => r.json());
    assert(userLogin.isAdmin === false && !!userLogin.token, 'Customer logged in with valid JWT');

    // 5. Products Retrieval & Category Filtering
    const allProds = await fetch(base + '/products').then(r => r.json());
    assert(allProds.products.length >= 8, `Catalog returns all products (found ${allProds.products.length})`);

    const audioProds = await fetch(base + '/products?category=Audio').then(r => r.json());
    assert(audioProds.products.every(p => p.category.toLowerCase() === 'audio'), 'Category filtering works');

    // 6. Security & Admin Authorization Check: Non-admin trying to add a product
    const unauthAdd = await fetch(base + '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userLogin.token}` },
      body: JSON.stringify({ name: 'Hacked', price: 10, category: 'Audio', description: 'desc' }),
    });
    assert(unauthAdd.status === 403, 'Regular customer blocked from adding products (403 Forbidden)');

    // 7. Admin adds and deletes a product
    const newProd = await fetch(base + '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminLogin.token}` },
      body: JSON.stringify({
        name: 'Test Precision Dial',
        price: 85,
        category: 'Desk Setup',
        description: 'CNC aluminum volume knob and controller',
        countInStock: 5,
      }),
    }).then(r => r.json());
    assert(newProd.name === 'Test Precision Dial', 'Admin successfully added new product');

    // 8. Stock Limitations: Ordering more than available stock
    const excessOrder = await fetch(base + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userLogin.token}` },
      body: JSON.stringify({
        orderItems: [{ product: newProd._id, name: newProd.name, qty: 999, price: newProd.price, image: newProd.image }],
        shippingAddress: { name: 'Elena', email: 'customer@aura.store', phone: '555-0100', address: '123 St', city: 'SF', postalCode: '94107' },
        subtotal: 999 * 85,
        shippingPrice: 0,
        taxPrice: 10,
        totalPrice: 999 * 85 + 10,
      }),
    });
    assert(excessOrder.status === 400, 'Order exceeding inventory blocked with 400 Insufficient Stock');

    // 9. Valid Order & Stock Deduction Check
    const validOrder = await fetch(base + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userLogin.token}` },
      body: JSON.stringify({
        orderItems: [{ product: newProd._id, name: newProd.name, qty: 2, price: newProd.price, image: newProd.image }],
        shippingAddress: { name: 'Elena', email: 'customer@aura.store', phone: '555-0100', address: '123 St', city: 'SF', postalCode: '94107' },
        subtotal: 170,
        shippingPrice: 0,
        taxPrice: 13.6,
        totalPrice: 183.6,
      }),
    }).then(r => r.json());
    assert(validOrder.status === 'Order Placed' && validOrder.orderNumber.startsWith('ORD-'), 'Order placed with unique ORD ID');

    // Check that stock was reduced from 5 to 3
    const updatedProd = await fetch(base + `/products/${newProd._id}`).then(r => r.json());
    assert(updatedProd.countInStock === 3, `Inventory automatically reduced from 5 to 3 (actual: ${updatedProd.countInStock})`);

    // 10. Admin Updates Order Status
    const statusUpdate = await fetch(base + `/orders/${validOrder._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminLogin.token}` },
      body: JSON.stringify({ status: 'Shipped' }),
    }).then(r => r.json());
    assert(statusUpdate.status === 'Shipped', 'Order status progressed from Order Placed to Shipped');

    // 11. Customer Reviews Product
    const reviewRes = await fetch(base + `/products/${newProd._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userLogin.token}` },
      body: JSON.stringify({ rating: 5, comment: 'Flawless build quality!' }),
    }).then(r => r.json());
    assert(reviewRes.message === 'Review added successfully', 'Product review submitted and verified');

    // Clean up created product
    await fetch(base + `/products/${newProd._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminLogin.token}` },
    });

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  } catch (e) {
    console.error('Test execution error:', e);
  }
}

runComprehensiveTests();
