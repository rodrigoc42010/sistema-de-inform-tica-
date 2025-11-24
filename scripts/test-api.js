const BASE_URL = 'http://localhost:5001/api/users';

async function testApi() {
    try {
        console.log('Testing /debug endpoint...');
        try {
            const debugRes = await fetch(`${BASE_URL}/debug`);
            if (!debugRes.ok) {
                throw new Error(`Debug endpoint failed: ${debugRes.status} ${debugRes.statusText}`);
            }
            const debugData = await debugRes.json();
            console.log('Debug Response:', debugData);

            if (!debugData.tables.users) {
                console.error('ERROR: Users table not found!');
                return;
            }
        } catch (e) {
            console.error('Failed to connect to server:', e.message);
            console.log('Make sure the backend server is running on port 5001.');
            return;
        }

        console.log('\nTesting Registration...');
        const email = `api_test_${Date.now()}@example.com`;
        const payload = {
            name: 'API Test User',
            email: email,
            password: 'password123',
            role: 'client',
            phone: '11999999999',
            cpfCnpj: '12345678901',
            address: { street: 'Test St', number: '123' },
            termsAccepted: true
        };

        const regRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const regData = await regRes.json();
        console.log('Registration Response:', regRes.status, regData);

        if (regRes.status === 201) {
            console.log('SUCCESS: User registered via API.');
        } else {
            console.error('FAILURE: Unexpected status code.');
        }

    } catch (error) {
        console.error('API Test Failed:', error.message);
    }
}

testApi();
