const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const initPostgres = require('../config/pg');
const { getPool } = require('../db/pgClient');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');
const Ticket = require('../models/ticketModel');
const Ad = require('../models/adModel');
const Payment = require('../models/paymentModel');
const BlacklistedToken = require('../models/blacklistedTokenModel');

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sistema-informatica';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

async function ensureAdmin(pool) {
  const email = 'admin@localhost';
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rowCount) return exists.rows[0].id;
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('admin', salt);
  const inserted = await pool.query(
    'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    ['Administrador', email, hashed, 'technician', '000000000', '00000000000', JSON.stringify({ city: 'Local', state: 'Local' }), true]
  );
  return inserted.rows[0].id;
}

async function migrate() {
  console.log('Iniciando migração MongoDB -> Postgres...');
  await connectMongo();
  const ok = await initPostgres();
  if (!ok) throw new Error('Falha ao inicializar Postgres');
  const pool = getPool();

  const userIdMap = new Map();
  const techIdMap = new Map();
  const ticketIdMap = new Map();
  const adIdMap = new Map();

  // Usuários
  const users = await User.find({}).lean();
  for (const u of users) {
    const address = u.address ? JSON.stringify(u.address) : null;
    const bankInfo = u.bankInfo ? JSON.stringify(u.bankInfo) : null;
    const inserted = await pool.query(
      'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,bank_info,profile_image,email_verified,email_verification_token,email_verification_expires,failed_login_attempts,lock_until,last_login_at,password_changed_at,ad_free_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password=EXCLUDED.password, role=EXCLUDED.role, phone=EXCLUDED.phone, cpf_cnpj=EXCLUDED.cpf_cnpj, address=EXCLUDED.address, bank_info=EXCLUDED.bank_info, profile_image=EXCLUDED.profile_image, email_verified=EXCLUDED.email_verified, email_verification_token=EXCLUDED.email_verification_token, email_verification_expires=EXCLUDED.email_verification_expires, failed_login_attempts=EXCLUDED.failed_login_attempts, lock_until=EXCLUDED.lock_until, last_login_at=EXCLUDED.last_login_at, password_changed_at=EXCLUDED.password_changed_at, ad_free_until=EXCLUDED.ad_free_until RETURNING id',
      [
        u.name,
        u.email,
        u.password,
        u.role,
        u.phone,
        u.cpfCnpj || null,
        address,
        bankInfo,
        u.profileImage || null,
        !!u.emailVerified,
        u.emailVerificationToken || null,
        u.emailVerificationExpires || null,
        u.failedLoginAttempts || 0,
        u.lockUntil || null,
        u.lastLoginAt || null,
        u.passwordChangedAt || null,
        u.adFreeUntil || null,
      ]
    );
    userIdMap.set(String(u._id), inserted.rows[0].id);
  }

  // Técnicos
  const techs = await Technician.find({}).lean();
  for (const t of techs) {
    const uid = userIdMap.get(String(t.userId));
    if (!uid) continue;
    const services = JSON.stringify(t.services || []);
    const specialties = JSON.stringify(t.specialties || []);
    const reviews = JSON.stringify(t.reviews || []);
    const certifications = JSON.stringify(t.certifications || []);
    const paymentMethods = JSON.stringify(t.paymentMethods || []);
    const loginId = t.loginId || `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const inserted = await pool.query(
      'INSERT INTO technicians (user_id,login_id,services,specialties,rating,total_reviews,reviews,availability,pickup_service,pickup_fee,certifications,payment_methods,subscription_active,subscription_expiry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (login_id) DO UPDATE SET user_id=EXCLUDED.user_id, services=EXCLUDED.services, specialties=EXCLUDED.specialties, rating=EXCLUDED.rating, total_reviews=EXCLUDED.total_reviews, reviews=EXCLUDED.reviews, availability=EXCLUDED.availability, pickup_service=EXCLUDED.pickup_service, pickup_fee=EXCLUDED.pickup_fee, certifications=EXCLUDED.certifications, payment_methods=EXCLUDED.payment_methods, subscription_active=EXCLUDED.subscription_active, subscription_expiry=EXCLUDED.subscription_expiry RETURNING id',
      [uid, loginId, services, specialties, t.rating || 0, t.totalReviews || 0, reviews, !!t.availability, !!t.pickupService, t.pickupFee || 0, certifications, paymentMethods, !!t.subscriptionActive, t.subscriptionExpiry || null]
    );
    techIdMap.set(String(t._id), inserted.rows[0].id);
  }

  // Tickets
  const tickets = await Ticket.find({}).lean();
  for (const tk of tickets) {
    const client = userIdMap.get(String(tk.client));
    const technician = tk.technician ? userIdMap.get(String(tk.technician)) : null;
    if (!client) continue;
    const attachments = JSON.stringify(tk.attachments || []);
    const serviceItems = JSON.stringify(tk.serviceItems || []);
    const pickupAddress = tk.pickupAddress ? JSON.stringify(tk.pickupAddress) : null;
    const notes = JSON.stringify(tk.notes || []);
    const inserted = await pool.query(
      'INSERT INTO tickets (title,description,client,technician,status,priority,device_type,device_brand,device_model,attachments,service_items,initial_diagnosis,final_report,start_date,estimated_completion_date,completion_date,total_price,payment_status,payment_method,pickup_requested,pickup_address,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id',
      [
        tk.title,
        tk.description,
        client,
        technician,
        tk.status || null,
        tk.priority || null,
        tk.deviceType || null,
        tk.deviceBrand || null,
        tk.deviceModel || null,
        attachments,
        serviceItems,
        tk.initialDiagnosis || null,
        tk.finalReport || null,
        tk.startDate || null,
        tk.estimatedCompletionDate || null,
        tk.completionDate || null,
        tk.totalPrice || 0,
        tk.paymentStatus || null,
        tk.paymentMethod || null,
        !!tk.pickupRequested,
        pickupAddress,
        notes,
      ]
    );
    ticketIdMap.set(String(tk._id), inserted.rows[0].id);
  }

  // Anúncios
  const ads = await Ad.find({}).lean();
  for (const ad of ads) {
    const createdBy = userIdMap.get(String(ad.createdBy));
    if (!createdBy) continue;
    const inserted = await pool.query(
      'INSERT INTO ads (title,text,link_url,media_url,audience,active,start_date,end_date,created_by,impressions,clicks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [ad.title, ad.text, ad.linkUrl || null, ad.mediaUrl || null, ad.audience || 'client', !!ad.active, ad.startDate || null, ad.endDate || null, createdBy, ad.impressions || 0, ad.clicks || 0]
    );
    adIdMap.set(String(ad._id), inserted.rows[0].id);
  }

  // Pagamentos
  const payments = await Payment.find({}).lean();
  for (const p of payments) {
    const ad = p.ad ? adIdMap.get(String(p.ad)) : null;
    const ticket = p.ticket ? ticketIdMap.get(String(p.ticket)) : null;
    const client = p.client ? userIdMap.get(String(p.client)) : null;
    const technician = p.technician ? userIdMap.get(String(p.technician)) : null;
    await pool.query(
      'INSERT INTO payments (type,ad,ticket,client,technician,amount,currency,payment_method,status,payment_intent_id,payment_date,receipt_url,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [p.type || 'ticket', ad, ticket, client, technician, p.amount || 0, p.currency || 'BRL', p.paymentMethod || 'unknown', p.status || 'pendente', p.paymentIntentId || null, p.paymentDate || null, p.receiptUrl || null, p.notes || null]
    );
  }

  // Tokens em blacklist
  const bl = await BlacklistedToken.find({}).lean();
  for (const b of bl) {
    const uid = userIdMap.get(String(b.user));
    if (!uid) continue;
    await pool.query('INSERT INTO blacklisted_tokens (jti,user_id,expires_at,reason) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING', [b.jti, uid, b.expiresAt, b.reason || null]);
  }

  const adminId = await ensureAdmin(pool);
  console.log('Migração concluída. Admin criado com id:', adminId);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrate().then(() => {
    console.log('OK');
    process.exit(0);
  }).catch((e) => {
    console.error('Falha na migração:', e);
    process.exit(1);
  });
}