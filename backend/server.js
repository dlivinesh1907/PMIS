const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const errorHandler = require('./middleware/errorHandler');
const simulator = require('./services/sensorSimulator');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const machineRoutes = require('./routes/machineRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Provide socket instance to Express and Simulator
app.set('io', io);
simulator.setIO(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'PMIS Node.js Backend & Realtime Engine',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current simulation status to newly connected client
  socket.emit('simulation_status', simulator.getStatus());

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Database Connection & Server Boot
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/predictive_maintenance';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    server.listen(PORT, () => {
      console.log(`PMIS Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting HTTP server in offline/standby mode...');
    server.listen(PORT, () => {
      console.log(`PMIS Backend listening on http://localhost:${PORT} (Database pending connection)`);
    });
  });

module.exports = { app, server };
