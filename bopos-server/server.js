const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// 跳过 ngrok 浏览器警告
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

const dbPath = path.join(__dirname, 'bopos.db');
const db = new Database(dbPath);

// ── 建表 ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    openid TEXT UNIQUE,
    source TEXT DEFAULT 'qr',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT DEFAULT '🍽️',
    available INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_id INTEGER,
    table_name TEXT,
    customer_id TEXT,
    customer_name TEXT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    note TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    payment TEXT DEFAULT '未支付',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// 插入默认菜单（如果为空）
const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get();
if (menuCount.c === 0) {
  const insertMenu = db.prepare('INSERT INTO menu_items (name, price, category, emoji) VALUES (?, ?, ?, ?)');
  [
    ['红烧肉', 48, '主菜', '🥩'],
    ['夫妻肺片', 38, '凉菜', '🥗'],
    ['麻婆豆腐', 28, '主菜', '🫘'],
    ['口水鸡', 42, '凉菜', '🍗'],
    ['西红柿炒蛋', 22, '家常菜', '🍳'],
    ['蒜蓉虾', 68, '海鲜', '🦐'],
    ['清蒸鱼', 88, '海鲜', '🐟'],
    ['炒青菜', 18, '素菜', '🥬'],
    ['扬州炒饭', 26, '主食', '🍚'],
    ['小米粥', 12, '主食', '🥣'],
  ].forEach(([name, price, category, emoji]) => insertMenu.run(name, price, category, emoji));
}

// 插入默认桌号（如果为空）
const tableCount = db.prepare('SELECT COUNT(*) as c FROM tables').get();
if (tableCount.c === 0) {
  const insertTable = db.prepare('INSERT INTO tables (name, qr_code) VALUES (?, ?)');
  for (let i = 1; i <= 10; i++) {
    insertTable.run(`${i}号桌`, `TABLE_${i}`);
  }
}

// ── 会员 API ──────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { code, phone, name } = req.body;
  if (!code) return res.json({ success: false, message: 'code 不能为空' });
  const openid = `WX-${code}`;
  let customer = db.prepare('SELECT * FROM customers WHERE openid=?').get(openid);
  if (!customer && phone) {
    customer = db.prepare('SELECT * FROM customers WHERE phone=?').get(phone);
    if (customer) {
      db.prepare('UPDATE customers SET openid=? WHERE id=?').run(openid, customer.id);
      customer.openid = openid;
    }
  }
  if (!customer) {
    const id = `CUST-WX-${Date.now()}`;
    const safePhone = phone || openid;
    db.prepare('INSERT INTO customers (id, name, phone, openid, source) VALUES (?, ?, ?, ?, ?)').run(
      id,
      name || '微信用户',
      safePhone,
      openid,
      'wx'
    );
    customer = db.prepare('SELECT * FROM customers WHERE id=?').get(id);
    io.emit('customer_registered', { id: customer.id, name: customer.name, phone: customer.phone });
  }
  res.json({ success: true, customer, openid });
});

app.post('/api/register', (req, res) => {
  const { name, phone, openid } = req.body;
  if (!name || !phone) return res.json({ success: false, message: '姓名和手机号不能为空' });
  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
  if (existing) return res.json({ success: false, message: '该手机号已注册' });
  const id = 'CUST-' + Date.now();
  db.prepare('INSERT INTO customers (id, name, phone, openid, source) VALUES (?, ?, ?, ?, ?)').run(
    id,
    name,
    phone,
    openid || null,
    'qr'
  );
  const customer = db.prepare('SELECT * FROM customers WHERE id=?').get(id);
  io.emit('customer_registered', { id: customer.id, name: customer.name, phone: customer.phone });
  res.json({ success: true, message: '注册成功', customer });
});

app.get('/api/customers', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  res.json({ success: true, customers });
});

app.put('/api/customers/:id', (req, res) => {
  const { name, phone } = req.body;
  db.prepare('UPDATE customers SET name=?, phone=? WHERE id=?').run(name, phone, req.params.id);
  res.json({ success: true });
});

// ── 菜单 API ──────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items WHERE available=1 ORDER BY category, sort_order').all();
  res.json({ success: true, items });
});

app.post('/api/menu', (req, res) => {
  const { name, price, category, emoji } = req.body;
  const result = db.prepare('INSERT INTO menu_items (name, price, category, emoji) VALUES (?, ?, ?, ?)').run(name, price, category, emoji || '🍽️');
  io.emit('menu_updated');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/menu/:id', (req, res) => {
  const { name, price, category, emoji, available } = req.body;
  db.prepare('UPDATE menu_items SET name=?, price=?, category=?, emoji=?, available=? WHERE id=?')
    .run(name, price, category, emoji, available ?? 1, req.params.id);
  io.emit('menu_updated');
  res.json({ success: true });
});

app.delete('/api/menu/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id=?').run(req.params.id);
  io.emit('menu_updated');
  res.json({ success: true });
});

// ── 桌号 API ──────────────────────────────────────
app.get('/api/tables', (req, res) => {
  const tables = db.prepare('SELECT * FROM tables ORDER BY id').all();
  res.json({ success: true, tables });
});

app.get('/api/tables/:qrcode', (req, res) => {
  const table = db.prepare('SELECT * FROM tables WHERE qr_code=?').get(req.params.qrcode);
  if (!table) return res.json({ success: false, message: '桌号不存在' });
  res.json({ success: true, table });
});

// ── 订单 API ──────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { table_id, table_name, customer_id, customer_name, items, total, note, payment } = req.body;
  const id = 'ORD-' + Date.now();
  db.prepare(`INSERT INTO orders (id, table_id, table_name, customer_id, customer_name, items, total, note, payment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, table_id, table_name, customer_id || null, customer_name || '散客', JSON.stringify(items), total, note || '', payment || '未支付');
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  const parsed = { ...order, items: JSON.parse(order.items) };
  io.emit('new_order', parsed);
  res.json({ success: true, order: parsed });
});

app.get('/api/orders', (req, res) => {
  const { status, date } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (date) { sql += ' AND date(created_at)=?'; params.push(date); }
  sql += ' ORDER BY created_at DESC';
  const orders = db.prepare(sql).all(...params).map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json({ success: true, orders });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  const parsed = { ...order, items: JSON.parse(order.items) };
  io.emit('order_updated', parsed);
  res.json({ success: true });
});

app.post('/api/payments/prepay', (req, res) => {
  const { order_id, openid, amount } = req.body;
  if (!order_id) return res.json({ success: false, message: '缺少订单号' });
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(order_id);
  if (!order) return res.json({ success: false, message: '订单不存在' });
  const payload = {
    success: true,
    prepay_id: `PREPAY-${Date.now()}`,
    order_id,
    amount: amount || order.total,
    openid,
    nonce_str: Math.random().toString(36).slice(2),
  };
  res.json(payload);
});

// ── WebSocket ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  socket.on('disconnect', () => console.log('客户端断开:', socket.id));
});

server.listen(3000, '0.0.0.0', () => console.log('✅ bopos server running on port 3000'));
