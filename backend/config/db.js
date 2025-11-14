const mongoose = require('mongoose');
const initPostgres = require('./pg');

const connectDB = async () => {
  // Se configurado para Postgres, inicializar e retornar
  if ((process.env.DB_TYPE || '').toLowerCase() === 'postgres' || process.env.DATABASE_URL) {
    const ok = await initPostgres();
    if (ok) return true;
    // Se falhar Postgres, continuar tentando Mongo como fallback
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`.cyan.underline);
    return true;
  } catch (error) {
    console.log(`Aviso: ${error.message}`.yellow.underline.bold);
    console.log('Servidor continuará funcionando sem conexão com o banco de dados'.yellow);
    return false;
  }
};

module.exports = connectDB;