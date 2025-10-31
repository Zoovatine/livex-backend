import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN?.split(',') || "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ✅ Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Add a simple homepage route
app.get("/", (req, res) => {
  res.send("🚀 LiveX Backend is running!");
});

// ✅ Add a health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "LiveX" });
});

// (You can add other routes below here, e.g. donations, events, etc.)

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LiveX backend running on port ${PORT}`);
});
