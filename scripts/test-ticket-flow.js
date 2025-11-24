const API_URL = 'http://localhost:5001/api';

async function testTicketFlow() {
    try {
        console.log('=== Testing Ticket Creation and Listing ===\n');

        // 1. Create a client user
        console.log('1. Creating client user...');
        const clientEmail = `client_ticket_test_${Date.now()}@example.com`;
        const clientRegisterRes = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Client Ticket Test',
                email: clientEmail,
                password: 'password123',
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

        if (!clientRegisterRes.ok) {
            throw new Error(`Client registration failed: ${await clientRegisterRes.text()}`);
        }

        const clientData = await clientRegisterRes.json();
        const clientToken = clientData.token;
        console.log('✓ Client created:', clientData.name);

        // 2. Get list of technicians
        console.log('\n2. Fetching technicians...');
        const techRes = await fetch(`${API_URL}/users/technicians`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });

        if (!techRes.ok) {
            throw new Error(`Failed to fetch technicians: ${await techRes.text()}`);
        }

        const technicians = await techRes.json();
        console.log(`✓ Found ${technicians.length} technician(s)`);

        if (technicians.length === 0) {
            console.log('⚠ No technicians available. Skipping tests.');
            return;
        } else {
            console.log(`  - First technician: ${technicians[0].name}`);
        }

        // 3. Test 1: Create ticket WITH manual technician selection
        console.log('\n3. TEST 1: Creating ticket WITH manual technician selection...');
        const ticket1Payload = {
            title: 'Test Ticket 1 - Manual Assignment',
            description: 'Testing manual technician assignment',
            priority: 'alta',
            deviceType: 'Computador',
            deviceBrand: 'Dell',
            deviceModel: 'Inspiron 15',
            problemCategory: 'Hardware',
            attachments: [],
            serviceItems: [],
            pickupRequested: false,
            technician: technicians[0]._id  // Manual assignment
        };

        const createTicket1Res = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticket1Payload)
        });

        if (!createTicket1Res.ok) {
            throw new Error(`Ticket 1 creation failed: ${await createTicket1Res.text()}`);
        }

        const createdTicket1 = await createTicket1Res.json();
        console.log('✓ Ticket 1 created successfully!');
        console.log(`  - ID: ${createdTicket1.id}`);
        console.log(`  - Title: ${createdTicket1.title}`);
        console.log(`  - Technician: ${createdTicket1.technician || 'NONE'}`);
        console.log(`  - Status: ${createdTicket1.status}`);

        // 4. Test 2: Create ticket WITHOUT manual technician selection (auto-assignment)
        console.log('\n4. TEST 2: Creating ticket WITHOUT manual technician selection (auto-assignment)...');
        const ticket2Payload = {
            title: 'Test Ticket 2 - Auto Assignment',
            description: 'Testing automatic technician assignment',
            priority: 'media',
            deviceType: 'Celular',
            deviceBrand: 'Samsung',
            deviceModel: 'Galaxy S21',
            problemCategory: 'Software',
            attachments: [],
            serviceItems: [],
            pickupRequested: false
            // NO technician field - should auto-assign
        };

        const createTicket2Res = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticket2Payload)
        });

        if (!createTicket2Res.ok) {
            throw new Error(`Ticket 2 creation failed: ${await createTicket2Res.text()}`);
        }

        const createdTicket2 = await createTicket2Res.json();
        console.log('✓ Ticket 2 created successfully!');
        console.log(`  - ID: ${createdTicket2.id}`);
        console.log(`  - Title: ${createdTicket2.title}`);
        console.log(`  - Technician: ${createdTicket2.technician || 'NONE'}`);
        console.log(`  - Status: ${createdTicket2.status}`);

        // 5. Fetch all tickets as client
        console.log('\n5. Fetching all tickets as client...');
        const clientTicketsRes = await fetch(`${API_URL}/tickets`, {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });

        if (!clientTicketsRes.ok) {
            throw new Error(`Failed to fetch client tickets: ${await clientTicketsRes.text()}`);
        }

        const clientTickets = await clientTicketsRes.json();
        console.log(`✓ Client sees ${clientTickets.length} ticket(s)`);
        clientTickets.forEach((ticket, index) => {
            console.log(`  ${index + 1}. ${ticket.title} - Technician: ${ticket.technician || 'NONE'}`);
        });

        console.log('\n=== SUCCESS: All tests passed! ===');
        console.log('\nSummary:');
        console.log(`- Client created: ${clientData.name}`);
        console.log(`- Tickets created: ${clientTickets.length}`);
        console.log(`- Ticket 1 (manual): Technician ${createdTicket1.technician ? 'ASSIGNED' : 'NOT ASSIGNED'}`);
        console.log(`- Ticket 2 (auto): Technician ${createdTicket2.technician ? 'ASSIGNED' : 'NOT ASSIGNED'}`);

        if (!createdTicket1.technician) {
            console.log('\n⚠ WARNING: Manual assignment failed!');
        }
        if (!createdTicket2.technician) {
            console.log('\n⚠ WARNING: Auto-assignment failed!');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

testTicketFlow();
