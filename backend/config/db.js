const mongoose = require('mongoose');

const connectDB = async () => {
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