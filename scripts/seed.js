const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const initPostgres = require('../backend/src/infrastructure/database/pg');
const { getPool } = require('../backend/src/infrastructure/database/pgClient');

async function upsertDefaultUsers(pool) {
  const seedPassword = process.env.SEED_PASSWORD || '123456';
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(seedPassword, salt);

  const techEmail = process.env.SEED_TECH_EMAIL || 'tech@example.com';
  const rsTechUser = await pool.query(
    'SELECT * FROM users WHERE email=$1 LIMIT 1',
    [techEmail]
  );
  let techUser = rsTechUser.rowCount ? rsTechUser.rows[0] : null;
  if (!techUser) {
    const address = {
      street: 'Rua Exemplo',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '01000-000',
    };
    const inserted = await pool.query(
      'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [
        'Técnico Padrão',
        techEmail,
        hashed,
        'technician',
        '11999999999',
        '12345678900',
        JSON.stringify(address),
        true,
      ]
    );
    techUser = inserted.rows[0];
  }

  const rsTech = await pool.query(
    'SELECT * FROM technicians WHERE user_id=$1 LIMIT 1',
    [techUser.id]
  );
  let tech = rsTech.rowCount ? rsTech.rows[0] : null;
  if (!tech) {
    const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    const services = [
      {
        name: 'Formatação de Sistema',
        description: 'Limpeza e reinstalação',
        price: 150,
      },
      {
        name: 'Troca de HD/SSD',
        description: 'Instalação e clonagem',
        price: 250,
      },
    ];
    const specialties = ['Hardware', 'Software'];
    const paymentMethods = ['PIX', 'Dinheiro'];
    await pool.query(
      'INSERT INTO technicians (user_id,login_id,services,specialties,availability,pickup_service,pickup_fee,payment_methods) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        techUser.id,
        loginId,
        JSON.stringify(services),
        JSON.stringify(specialties),
        true,
        true,
        30,
        JSON.stringify(paymentMethods),
      ]
    );
    const rsNewTech = await pool.query(
      'SELECT * FROM technicians WHERE user_id=$1 LIMIT 1',
      [techUser.id]
    );
    tech = rsNewTech.rowCount ? rsNewTech.rows[0] : null;
  }

  const clientEmail = process.env.SEED_CLIENT_EMAIL || 'client@example.com';
  const rsClientUser = await pool.query(
    'SELECT * FROM users WHERE email=$1 LIMIT 1',
    [clientEmail]
  );
  let clientUser = rsClientUser.rowCount ? rsClientUser.rows[0] : null;
  if (!clientUser) {
    const address = {
      street: 'Av. Demonstração',
      number: '200',
      neighborhood: 'Bairro',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      zipCode: '02000-000',
    };
    const inserted = await pool.query(
      'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [
        'Cliente Padrão',
        clientEmail,
        hashed,
        'client',
        '11988888888',
        '98765432100',
        JSON.stringify(address),
        true,
      ]
    );
    clientUser = inserted.rows[0];
  }

  return { techUser, clientUser, tech };
}

async function seedAds(pool, techUserId) {
  const rsCount = await pool.query('SELECT COUNT(1) AS c FROM ads');
  const count = Number(rsCount.rows[0].c || 0);
  if (count > 0) return;
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO ads (title,text,audience,active,start_date,end_date,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7),($8,$9,$10,$11,$12,$13,$14)',
    [
      'Oferta: Formatação Completa',
      'Formatação com backup por apenas R$ 150,00!',
      'client',
      true,
      now,
      end,
      techUserId,
      'Troca de SSD com Desconto',
      'Ganhe performance trocando para SSD. Parcela no PIX!',
      'all',
      true,
      now,
      end,
      techUserId,
    ]
  );
}

async function seedTicket(pool, clientId, techUserId) {
  const rsCount = await pool.query('SELECT COUNT(1) AS c FROM tickets');
  const count = Number(rsCount.rows[0].c || 0);
  if (count > 0) return;
  const serviceItems = [
    {
      name: 'Diagnóstico inicial',
      description: 'Verificação de disco e RAM',
      price: 50,
      approved: true,
    },
  ];
  const notes = [
    {
      text: 'Cliente relata queda de performance após atualização do Windows.',
    },
  ];
  await pool.query(
    'INSERT INTO tickets (title,description,client,technician,status,priority,device_type,device_brand,device_model,service_items,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [
      'Notebook lento',
      'Equipamento iniciou muito lento hoje. Suspeita de HD antigo.',
      clientId,
      techUserId,
      'aberto',
      'alta',
      'Notebook',
      'Dell',
      'Inspiron 15',
      JSON.stringify(serviceItems),
      JSON.stringify(notes),
    ]
  );
}

async function main() {
  try {
    const ok = await initPostgres();
    if (!ok) throw new Error('Falha ao inicializar Postgres');
    const pool = getPool();
    const { techUser, clientUser } = await upsertDefaultUsers(pool);
    await seedAds(pool, techUser.id);
    await seedTicket(pool, clientUser.id, techUser.id);
    console.log('Seed concluído com sucesso.');
  } catch (err) {
    console.error('Falha no seed:', err?.message || err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
