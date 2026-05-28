const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'leads.json');

const IS_CLOUD = !!process.env.SUPABASE_URL;

let supabase = null;
if (IS_CLOUD) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function readLeads() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

function writeLeads(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/leads', async (req, res) => {
  const { name, phone, note } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ ok: false, msg: '姓名和手机号不能为空' });
  }
  const newLead = {
    name,
    phone,
    note: note || '',
    source: req.headers['user-agent']?.includes('Mobile') ? '手机端' : '电脑端',
    status: 'new',
    created_at: new Date().toISOString()
  };

  if (IS_CLOUD) {
    const { data, error } = await supabase.from('leads').insert(newLead).select().single();
    if (error) return res.status(500).json({ ok: false, msg: error.message });
    return res.json({ ok: true, data: data });
  }

  const leads = readLeads();
  newLead.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  newLead.createdAt = new Date().toLocaleString('zh-CN');
  leads.unshift(newLead);
  writeLeads(leads);
  res.json({ ok: true, data: newLead });
});

app.get('/api/leads', async (req, res) => {
  if (IS_CLOUD) {
    let query = supabase.from('leads').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    const { status, keyword } = req.query;
    if (status && status !== 'all') query = query.eq('status', status);
    if (keyword) query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`);
    const { data, count, error } = await query;
    if (error) return res.status(500).json({ ok: false, msg: error.message });
    return res.json({ ok: true, data, total: count });
  }

  const leads = readLeads();
  const { status, keyword } = req.query;
  let filtered = leads;
  if (status && status !== 'all') filtered = filtered.filter(l => l.status === status);
  if (keyword) filtered = filtered.filter(l => l.name.includes(keyword) || l.phone.includes(keyword));
  res.json({ ok: true, data: filtered, total: filtered.length });
});

app.put('/api/leads/:id', async (req, res) => {
  if (IS_CLOUD) {
    const { data, error } = await supabase.from('leads').update(req.body).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ ok: false, msg: error.message });
    return res.json({ ok: true, data });
  }
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, msg: '未找到该线索' });
  leads[idx] = { ...leads[idx], ...req.body, id: leads[idx].id };
  writeLeads(leads);
  res.json({ ok: true, data: leads[idx] });
});

app.delete('/api/leads/:id', async (req, res) => {
  if (IS_CLOUD) {
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ ok: false, msg: error.message });
    return res.json({ ok: true });
  }
  let leads = readLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  writeLeads(leads);
  res.json({ ok: true });
});

app.use(express.static(__dirname));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.listen(PORT, () => {
  console.log('========================================');
  console.log(IS_CLOUD ? '  ☁️  消防培训获客系统 [云模式]' : '  💻 消防培训获客系统 [本地模式]');
  console.log('========================================');
  console.log(`  落地页: http://localhost:${PORT}/`);
  console.log(`  后台:   http://localhost:${PORT}/admin/admin.html`);
  console.log('========================================');
});
