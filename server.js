// Load environment variables from .env file
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize express and HTTP server
const app = express();
const httpServer = createServer(app);

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Setup Socket.IO (for real-time events)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// ✅ Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Root route — confirms backend is running
app.get('/', (req, res) => {
  res.send('🚀 LiveX Backend is running!');
});

// ✅ Health check route — for monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'LiveX' });
});

// ✅ Example route — track donations/purchases
app.post('/event', async (req, res) => {
  const { username, amount, type } = req.body; // type = 'donation' or 'purchase'

  if (!username || !amount || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Save event to Supabase
    const { data, error } = await supabase
      .from('events')
      .insert([{ username, amount, type }]);

    if (error) throw error;

    // Broadcast event in real-time via socket.io
    io.emit('new_event', { username, amount, type });

    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Error saving event:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Real-time connection logs
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LiveX backend running on port ${PORT}`);
});
