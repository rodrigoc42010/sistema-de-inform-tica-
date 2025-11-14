const initPostgres = require('./pg');

const connectDB = async () => {
  const ok = await initPostgres();
  return !!ok;
};

module.exports = connectDB;