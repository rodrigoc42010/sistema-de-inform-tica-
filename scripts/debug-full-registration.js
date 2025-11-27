const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://app_user:TreaInformatica2025!Supabase@db.pzxrojxhipxkyotafeig.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function debugRegistration() {
    console.log('🕵️‍♂️ Iniciando simulação de registro COMPLETO...');
    const client = await pool.connect();

    try {
        const email = `debug_full_${Date.now()}@teste.com`;
        const name = "Teste Full Debug";
        const password = "senha123";
        const role = "technician";
        const phone = "11999999999";
        const cpfCnpj = "000.000.000-00";
        const address = { street: "Rua Teste", number: "123" };
        const technician = {
            services: [{ name: "Formatação", initialPrice: 100 }],
            pickupService: true,
            pickupFee: 20,
            paymentMethods: ["pix", "cash"]
        };

        console.log(`📧 Email: ${email}`);

        await client.query('BEGIN');

        // 1. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
        const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const bankInfo = null;
        const addressJson = JSON.stringify(address);

        console.log('1. Inserindo Usuário...');
        const inserted = await client.query(
            'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,bank_info,email_verification_token,email_verification_expires,email_verified,terms_accepted,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id',
            [name, email, hashedPassword, role, phone, cpfCnpj, addressJson, bankInfo, verifyHash, verifyExp, false, true, new Date()]
        );
        const userId = inserted.rows[0].id;
        console.log(`✅ Usuário inserido! ID: ${userId}`);

        // 2. Insert Technician
        console.log('2. Inserindo Técnico...');
        const loginId = `TEC${Date.now()}`;
        const mappedServices = technician.services.map((s) => ({
            name: s.name,
            price: Number(s.initialPrice || 0),
            estimatedTime: s.estimatedTime,
            category: s.category,
            isActive: true,
        }));

        const tData = {
            user_id: userId,
            login_id: loginId,
            services: mappedServices,
            specialties: [],
            pickup_service: !!technician.pickupService,
            pickup_fee: Number(technician.pickupFee || 0),
            payment_methods: technician.paymentMethods
        };

        await client.query(
            'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [tData.user_id, tData.login_id, JSON.stringify(tData.services), JSON.stringify(tData.specialties), tData.pickup_service, tData.pickup_fee, JSON.stringify(tData.payment_methods)]
        );
        console.log('✅ Técnico inserido com sucesso!');

        await client.query('COMMIT');
        console.log('🎉 Transação COMMITADA com sucesso!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO NA SIMULAÇÃO:', err);
        console.error('   Mensagem:', err.message);
        if (err.detail) console.error('   Detalhe:', err.detail);
        if (err.hint) console.error('   Dica:', err.hint);
    } finally {
        client.release();
        await pool.end();
    }
}

debugRegistration();
