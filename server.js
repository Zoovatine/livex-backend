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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// WebSocket: listen for widgets
io.on('connection', (socket) => {
  socket.on('join_widget', (widgetId) => {
    socket.join(`widget:${widgetId}`);
  });
});

// Helper to broadcast updated totals
async function broadcastWidgetTotal(widgetId) {
  const { data, error } = await supabase
    .from('widgets')
    .select('id, total_cents, currency')
    .eq('id', widgetId)
    .single();

  if (!error && data) {
    io.to(`widget:${widgetId}`).emit('widget_update', {
      id: data.id,
      totalCents: data.total_cents,
      currency: data.currency
    });
  }
}

// Webhook endpoint (Whatnot, Streamlabs, etc.)
app.post('/webhook/event', async (req, res) => {
  const { user_id, widget_id, amount_cents, source, payload } = req.body;

  if (!user_id || !amount_cents) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Insert event
  await supabase.from('events').insert({
    user_id,
    widget_id,
    amount_cents,
    source: source || 'manual',
    payload: payload || {}
  });

  // Update widget total
  if (widget_id) {
    await supabase.rpc('add_to_widget_total', {
      widgetid: widget_id,
      add_cents: amount_cents
    });
    await broadcastWidgetTotal(widget_id);
  }

  res.json({ ok: true });
});

app.get('/', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
httpServer.listen(port, () => console.log('LiveX backend running on port', port));