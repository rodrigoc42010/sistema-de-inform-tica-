const BASE_URL = 'http://localhost:5001/api/users';

async function testTechnicianLogin() {
    try {
        console.log('Testing Technician Login...');

        // 1. Get a valid technician from the debug endpoint
        // Note: The debug endpoint returns recent users. We hope one is a technician.
        const debugRes = await fetch(`${BASE_URL}/debug`);
        const debugData = await debugRes.json();

        const techUser = debugData.recentUsers.find(u => u.role === 'technician');

        if (!techUser) {
            console.error('No technician found in recent users. Please run scripts/test-create-technician.js first.');
            return;
        }

        console.log(`Found technician: ${techUser.email} (ID: ${techUser.id})`);

        // We need the CPF or LoginID. The debug endpoint might not return it in the summary.
        // Let's assume we can use the one from the test script if it matches, OR we can try to fetch "me" if we had a token, but we don't.
        // Actually, the debug endpoint I wrote returns `id,email,role,created_at`. It doesn't return CPF.

        // So, let's just create a NEW technician right here via the API if possible, or use the direct DB access if we were running in node with pg.
        // Since this script runs with node, let's use the API to register a new technician if we can, OR just use the hardcoded one from the previous test if we know it.

        // Better approach: Use the direct DB access to get the credentials since we are in a dev environment script.
        // But this script is using fetch, so it's acting as a client.

        // Let's try to register a NEW technician via the API to be sure.
        // Wait, the register endpoint allows creating a technician.

        const email = `tech_login_test_${Date.now()}@example.com`;
        const password = 'password123';
        const cpfCnpj = `999${Date.now().toString().slice(-8)}`; // Randomish CPF

        console.log(`Registering new technician: ${email}`);
        const regRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Tech Login Test',
                email,
                password,
                role: 'technician',
                phone: '11999999999',
                cpfCnpj,
                address: { street: 'Test St' },
                termsAccepted: true,
                technician: {
                    services: [{ name: 'Format', price: 100 }]
                }
            })
        });

        const regData = await regRes.json();
        if (regRes.status !== 201) {
            console.error('Registration failed:', regData);
            return;
        }
        console.log('Technician registered successfully.');
        console.log(`Login ID: ${regData.loginId}`);
        console.log(`CPF: ${regData.cpfCnpj}`);

        // 2. Try to login
        console.log('Attempting login...');
        const loginPayload = {
            cpfCnpj: regData.cpfCnpj,
            password: password
        };

        const loginRes = await fetch(`${BASE_URL}/technician-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload)
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);

        if (loginRes.status === 200) {
            console.log('SUCCESS: Technician logged in.');
            console.log('Token:', loginData.token ? 'Received' : 'Missing');
        } else {
            console.log('FAILURE: Login failed.');
            console.log(loginData);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testTechnicianLogin();
