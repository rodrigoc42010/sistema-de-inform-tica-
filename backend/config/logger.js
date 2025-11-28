const winston = require('winston');
const path = require('path');

// Formato customizado
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Criar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service: 'sistema-informatica' },
    transports: [
        // Erros em arquivo separado
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Todos os logs
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Stream para Morgan
logger.stream = {
    write: (message) => logger.http(message.trim())
};

module.exports = logger;
