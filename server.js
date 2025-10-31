import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize Express + HTTP Server
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN?.split(',') || "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ✅ Fix here — use SUPABASE_KEY instead of SUPABASE_SERVICE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase credentials. Check Render environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Simple test route
app.get("/ping", (req, res) => {
  res.send("✅ LiveX backend is running and Supabase is connected!");
});

// Example: basic endpoint using Supabase
app.get("/users", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LiveX backend running on port ${PORT}`);
});