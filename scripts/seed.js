/*
  Seed de dados iniciais para o Sistema de Informática
  - Cria usuário técnico e cliente padrão, anúncios públicos e um chamado de exemplo
  - Idempotente: só cria se não existir
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('colors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../backend/config/db');
const User = require('../backend/models/userModel');
const Technician = require('../backend/models/technicianModel');
const Ad = require('../backend/models/adModel');
const Ticket = require('../backend/models/ticketModel');

async function ensureConnection() {
  const ok = await connectDB();
  if (!ok) {
    console.error('Falha ao conectar no MongoDB. Verifique MONGO_URI no .env.');
    process.exit(1);
  }
}

async function upsertDefaultUsers() {
  const seedPassword = process.env.SEED_PASSWORD || '123456';
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(seedPassword, salt);

  // Técnico padrão
  const techEmail = process.env.SEED_TECH_EMAIL || 'tech@example.com';
  let techUser = await User.findOne({ email: techEmail });
  if (!techUser) {
    techUser = await User.create({
      name: 'Técnico Padrão',
      email: techEmail,
      password: hashed,
      role: 'technician',
      phone: '11999999999',
      cpfCnpj: '12345678900',
      address: {
        street: 'Rua Exemplo',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zipCode: '01000-000',
      },
      emailVerified: true,
    });
    console.log(`Usuário técnico criado: ${techUser.email}`);
  } else {
    console.log(`Usuário técnico já existe: ${techUser.email}`);
  }

  // Vincular registro de técnico
  let tech = await Technician.findOne({ userId: techUser._id });
  if (!tech) {
    const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    tech = await Technician.create({
      userId: techUser._id,
      loginId,
      services: [
        { name: 'Formatação de Sistema', description: 'Limpeza e reinstalação', price: 150 },
        { name: 'Troca de HD/SSD', description: 'Instalação e clonagem', price: 250 },
      ],
      specialties: ['Hardware', 'Software'],
      availability: true,
      pickupService: true,
      pickupFee: 30,
      paymentMethods: ['PIX', 'Dinheiro'],
    });
    console.log(`Registro de técnico criado com LoginID: ${tech.loginId}`);
  } else {
    console.log(`Registro de técnico já existe com LoginID: ${tech.loginId}`);
  }

  // Cliente padrão
  const clientEmail = process.env.SEED_CLIENT_EMAIL || 'client@example.com';
  let clientUser = await User.findOne({ email: clientEmail });
  if (!clientUser) {
    clientUser = await User.create({
      name: 'Cliente Padrão',
      email: clientEmail,
      password: hashed,
      role: 'client',
      phone: '11988888888',
      cpfCnpj: '98765432100',
      address: {
        street: 'Av. Demonstração',
        number: '200',
        neighborhood: 'Bairro',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zipCode: '02000-000',
      },
      emailVerified: true,
    });
    console.log(`Usuário cliente criado: ${clientUser.email}`);
  } else {
    console.log(`Usuário cliente já existe: ${clientUser.email}`);
  }

  return { techUser, clientUser, tech };
}

async function seedAds(techUserId) {
  const count = await Ad.countDocuments();
  if (count > 0) {
    console.log(`Anúncios já presentes: ${count}. Pulando criação.`);
    return;
  }
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const ads = [
    {
      title: 'Oferta: Formatação Completa',
      text: 'Formatação com backup por apenas R$ 150,00!',
      audience: 'client',
      active: true,
      startDate: now,
      endDate: nextMonth,
      createdBy: techUserId,
    },
    {
      title: 'Troca de SSD com Desconto',
      text: 'Ganhe performance trocando para SSD. Parcela no PIX!',
      audience: 'all',
      active: true,
      startDate: now,
      endDate: nextMonth,
      createdBy: techUserId,
    },
  ];

  await Ad.insertMany(ads);
  console.log(`Criados ${ads.length} anúncios públicos.`);
}

async function seedTicket(clientId, techUserId) {
  const count = await Ticket.countDocuments();
  if (count > 0) {
    console.log(`Chamados já presentes: ${count}. Pulando criação.`);
    return;
  }
  await Ticket.create({
    title: 'Notebook lento',
    description: 'Equipamento iniciou muito lento hoje. Suspeita de HD antigo.',
    client: clientId,
    technician: techUserId,
    status: 'aberto',
    priority: 'alta',
    deviceType: 'Notebook',
    deviceBrand: 'Dell',
    deviceModel: 'Inspiron 15',
    problemCategory: 'Desempenho',
    serviceItems: [
      { name: 'Diagnóstico inicial', description: 'Verificação de disco e RAM', price: 50, approved: true },
    ],
    notes: [
      { text: 'Cliente relata queda de performance após atualização do Windows.' },
    ],
  });
  console.log('Chamado de exemplo criado.');
}

async function main() {
  try {
    await ensureConnection();
    const { techUser, clientUser, tech } = await upsertDefaultUsers();
    await seedAds(techUser._id);
    await seedTicket(clientUser._id, techUser._id);
    console.log('Seed concluído com sucesso.');
  } catch (err) {
    console.error('Falha no seed:', err?.message || err);
  } finally {
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(0);
  }
}

main();