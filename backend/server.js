const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const colors = require('colors');

// Infrastructure
const connectDB = require('./config/db');
const runMigrations = require('./src/infrastructure/database/migrationRunner');
const redisService = require('./src/infrastructure/external/RedisService');

// Middlewares
const errorHandler = require('./src/presentation/middlewares/ErrorMiddleware');
const { maskIP, getRequestIP } = require('./middleware/auditLogger');

// Routes
const authRoutes = require('./src/presentation/routes/AuthRoutes');
const ticketRoutes = require('./src/presentation/routes/TicketRoutes');
const userRoutes = require('./src/presentation/routes/UserRoutes');
const adRoutes = require('./src/presentation/routes/AdRoutes');
const paymentRoutes = require('./src/presentation/routes/PaymentRoutes');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// CORS Configuration
const { corsOrigins } = require('./config/appConfig');
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Audit Logging
app.use((req, res, next) => {
  const realIP = getRequestIP(req);
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${realIP}`
      .cyan
  );
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static Files & Frontend
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (require('fs').existsSync(path.join(frontendBuildPath, 'index.html'))) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
}

// Error Handler (Must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to Database
    const dbConnected = await connectDB();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...'.red);
      process.exit(1);
    }

    // 2. Run Migrations
    await runMigrations();

    // 3. Listen
    app.listen(PORT, () => {
      console.log(
        `
🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
📡 URL: http://localhost:${PORT}
📦 Database: Connected & Migrated
⚡ Redis: Ready
      `.green.bold
      );
    });
  } catch (err) {
    console.error('Critical failure during startup:'.red, err.message);
    process.exit(1);
  }
}

startServer();
