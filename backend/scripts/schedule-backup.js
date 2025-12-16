const cron = require('node-cron');
const { backupDatabase } = require('./backup-database');

// Executar backup diário às 3h da manhã
// Formato cron: min hora dia mes dia_semana
const scheduleBackup = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Iniciando backup automático agendado...');
    try {
      await backupDatabase();
      console.log('✅ Backup automático concluído com sucesso');
    } catch (error) {
      console.error('❌ Falha no backup automático:', error);
    }
  });

  console.log('📅 Agendador de backup iniciado (Diariamente às 03:00)');
};

module.exports = { scheduleBackup };
