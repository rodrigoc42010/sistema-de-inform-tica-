const API_URL = 'http://localhost:5001/api/users';

async function testTechniciansEndpoint() {
    try {
        // 1. Login as a client (using the user created in previous tests or a new one)
        const email = `tech_test_${Date.now()}@example.com`;
        const password = 'password123';

        console.log('Registering test user...');
        const registerRes = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Tech Test User',
                email,
                password,
                role: 'client',
                phone: '11999999999',
                cpfCnpj: '12345678901',
                address: {
                    street: 'Test St',
                    number: '123',
                    complement: '',
                    neighborhood: 'Center',
                    city: 'Sao Paulo',
                    state: 'SP',
                    zipCode: '01000000'
                },
                termsAccepted: true
            })
        });

        if (!registerRes.ok) {
            const err = await registerRes.text();
            throw new Error(`Registration failed: ${registerRes.status} ${err}`);
        }

        const registerData = await registerRes.json();
        const token = registerData.token;
        console.log('User registered. Token obtained.');

        // 2. Fetch technicians
        console.log('Fetching technicians...');
        const techRes = await fetch(`${API_URL}/technicians`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!techRes.ok) {
            const err = await techRes.text();
            throw new Error(`Fetch technicians failed: ${techRes.status} ${err}`);
        }

        const technicians = await techRes.json();
        console.log('Technicians response status:', techRes.status);
        console.log('Technicians found:', technicians.length);
        console.log('Technician list:', JSON.stringify(technicians, null, 2));

        if (Array.isArray(technicians)) {
            console.log('SUCCESS: /api/users/technicians endpoint is working.');
        } else {
            console.error('FAILURE: Unexpected response format.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error testing technicians endpoint:', error);
        process.exit(1);
    }
}

testTechniciansEndpoint();
