import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const TX_FILE = path.join(DATA_DIR, 'transactions.json');

await fs.mkdir(DATA_DIR, { recursive: true });
try { await fs.access(TX_FILE); } catch { await fs.writeFile(TX_FILE, '[]', 'utf8'); }

async function readTx() {
  try { return JSON.parse(await fs.readFile(TX_FILE, 'utf8')); }
  catch { return []; }
}
async function writeTx(items) {
  await fs.writeFile(TX_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function normalizePhone(phone) {
  const p = String(phone || '').replace(/\s+/g, '');
  if (/^07\d{8}$/.test(p)) return '254' + p.slice(1);
  if (/^\+2547\d{8}$/.test(p)) return p.slice(1);
  if (/^2547\d{8}$/.test(p)) return p;
  throw new Error('Use a Kenyan Safaricom number such as 07XXXXXXXX.');
}
function timestamp() {
  const d = new Date();
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth()+1).padStart(2,'0'),
    String(d.getUTCDate()).padStart(2,'0'),
    String(d.getUTCHours()).padStart(2,'0'),
    String(d.getUTCMinutes()).padStart(2,'0'),
    String(d.getUTCSeconds()).padStart(2,'0')
  ].join('');
}
function cfg(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

async function getAccessToken() {
  const key = cfg('MPESA_CONSUMER_KEY');
  const secret = cfg('MPESA_CONSUMER_SECRET');
  const base = (process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke').replace(/\/$/, '');
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const r = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) throw new Error(data.errorMessage || 'Daraja authorization failed.');
  return data.access_token;
}



function curriculumContext(subject, grade, focus) {
  const g = String(grade || '').trim();
  const subj = String(subject || '').trim();
  const f = String(focus || '').trim();
  const known = {
    '7|Mathematics': 'KICD Grade 7 Mathematics includes Numbers, Algebra, Measurements, Geometry, and Data Handling and Probability. Algebra includes Algebraic Expressions, Linear Equations and Linear Inequalities. Measurements include Pythagorean Relationship, Length, Area, Volume and Capacity, Time, Distance and Speed, Temperature, and Money.',
    '8|Mathematics': 'KICD Grade 8 Mathematics includes Numbers, Algebra, Measurements, Geometry, and Data Handling and Probability. Algebra includes Algebraic Expressions and Linear Equations. Measurements include Circles, Area, and Money; Geometry includes Geometrical Constructions, Coordinates and Graphs, Scale Drawing, and Common Solids.',
    '9|Mathematics': 'Use the KICD Grade 9 Mathematics curriculum context where available. Do not invent a strand or learning outcome; if a specific outcome is unknown, say so and provide a general explanation.'
  };
  const base = known[`${g}|${subj}`] || '';
  return [base, f ? `Requested CBE focus: ${f}` : ''].filter(Boolean).join('\\n');
}

function localStudyAssistant({ subject, grade, mode, focus, prompt }) {
  const q = String(prompt || '').trim();
  if (!q) throw new Error('Enter a question or topic first.');
  const subj = subject || 'General';
  const g = grade || 'General';
  const low = q.toLowerCase();
  const cbe = focus ? `\nCBE focus: ${focus}` : '';
  const header = `Tusome EduShelf Local Study Assistant\nSubject: ${subj} | Grade: ${g}\nMode: ${mode || 'answer'}${cbe}\n\n`;
  let body = '';

  const has = (...words) => words.some(w => low.includes(w));
  if (has('linear equation','linear equations')) {
    body = `Linear equations are equations in which the variable has a power of 1.\n\nExample:\n2x + 3 = 11\n2x = 11 - 3\n2x = 8\nx = 4\n\nCheck: 2(4) + 3 = 11, so x = 4.\n\nTip: Keep the equation balanced by doing the same operation to both sides.`;
  } else if (has('fraction','fractions')) {
    body = `A fraction represents part of a whole and is written as numerator/denominator.\n\nExample: 3/4 means 3 equal parts out of 4.\nTo add fractions with the same denominator, add the numerators and keep the denominator: 2/7 + 3/7 = 5/7.`;
  } else if (has('magnification')) {
    body = `Magnification compares the size of an image with the actual size of the object.\n\nFormula:\nMagnification = image size ÷ actual size.\n\nMake sure both measurements use the same units before calculating.`;
  } else if (has('photosynthesis')) {
    body = `Photosynthesis is the process by which green plants make food using light energy. The main raw materials are carbon dioxide and water. Chlorophyll absorbs light energy, and glucose and oxygen are produced.`;
  } else if (has('atom','atoms','molecule','molecules')) {
    body = `An atom is the smallest unit of an element that retains the element's chemical properties. A molecule is made when two or more atoms are chemically joined. For example, a water molecule contains hydrogen and oxygen atoms.`;
  } else if (has('pythagoras','pythagorean')) {
    body = `For a right-angled triangle, the Pythagorean relationship is a² + b² = c², where c is the longest side (the hypotenuse).\n\nExample: if a = 3 and b = 4, then c² = 9 + 16 = 25, so c = 5.`;
  } else if (has('speed','distance','time')) {
    body = `For motion problems:\nSpeed = Distance ÷ Time\nDistance = Speed × Time\nTime = Distance ÷ Speed\n\nAlways check that your units are consistent.`;
  } else {
    body = `Here is a simple study guide for your question:\n\n1. Identify the key idea in the question.\n2. Write down the relevant definition, rule, or formula.\n3. Work through a small example step by step.\n4. Check your answer and explain why it makes sense.\n\nYour question was: “${q}”\n\nFor a more specific answer, include the exact topic, exercise, or calculation you are working on.`;
  }

  if (mode === 'notes') body += `\n\nRevision notes:\n• Learn the key definition.\n• Memorise the relevant formula or rule.\n• Practise one worked example.\n• Try a new example without looking at the solution.`;
  if (mode === 'practice') body += `\n\nPractice questions:\n1. Define the main term in your own words.\n2. Give one example.\n3. Solve a similar problem and show your working.\n4. Explain how you checked your answer.`;
  if (mode === 'summary') body = `Summary — ${q}\n\n${body}\n\nKey point: Focus on the definition, method, example, and final check.`;
  return header + body;
}

app.post('/api/ai', async (req, res) => {
  try {
    const answer = localStudyAssistant(req.body || {});
    res.json({ ok: true, answer });
  } catch (e) {
    console.error('AI error:', e);
    const message = e?.message || 'AI service failed.';
    const status = /not configured/.test(message) ? 503 : 502;
    res.status(status).json({ error: message });
  }
});

app.get('/api/health', async (_req, res) => {
  const required = ['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_SHORTCODE','MPESA_PASSKEY','MPESA_CALLBACK_URL'];
  const aiConfigured = true;
  const missing = required.filter(name => !process.env[name]);
  res.json({
    ok: true,
    daraja: process.env.MPESA_ENV || 'sandbox',
    configured: missing.length === 0,
    missing,
    ai: { configured: aiConfigured, provider: 'local', model: 'built-in-local-study-assistant' }
  });
});

app.post('/api/payments/stkpush', async (req, res) => {
  try {
    const { materialId, title, amount, phone } = req.body || {};
    const numericAmount = Math.round(Number(amount));
    if (!materialId || !title || !Number.isFinite(numericAmount) || numericAmount < 1)
      return res.status(400).json({ error: 'Invalid material or amount.' });

    const normalizedPhone = normalizePhone(phone);
    const shortcode = cfg('MPESA_SHORTCODE');
    const passkey = cfg('MPESA_PASSKEY');
    const base = (process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke').replace(/\/$/, '');
    const ts = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
    const token = await getAccessToken();

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
      Amount: numericAmount,
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: cfg('MPESA_CALLBACK_URL'),
      AccountReference: String(materialId).slice(0, 12),
      TransactionDesc: `Tusome EduShelf: ${String(title).slice(0, 80)}`
    };

    const r = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();

    if (!r.ok || data.ResponseCode !== '0')
      return res.status(502).json({ error: data.errorMessage || data.ResponseDescription || 'Daraja rejected the STK Push.' });

    const tx = {
      transactionId: `TX-${Date.now()}`,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      materialId, title, amount: numericAmount, phone: normalizedPhone,
      status: 'pending', createdAt: new Date().toISOString()
    };
    const items = await readTx();
    items.unshift(tx);
    await writeTx(items);

    res.json({
      ok: true,
      checkoutRequestId: tx.checkoutRequestId,
      message: data.CustomerMessage || 'STK Push sent. Check the phone and complete the M-PESA prompt.'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Payment setup failed.' });
  }
});

app.post('/api/payments/callback', async (req, res) => {
  try {
    const stk = req.body?.Body?.stkCallback;
    if (!stk) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const items = await readTx();
    const tx = items.find(x => x.checkoutRequestId === stk.CheckoutRequestID);
    const resultCode = Number(stk.ResultCode);

    if (tx) {
      tx.status = resultCode === 0 ? 'paid' : 'failed';
      tx.resultCode = resultCode;
      tx.resultDescription = stk.ResultDesc || '';
      if (resultCode === 0) {
        const meta = Object.fromEntries((stk.CallbackMetadata?.Item || []).map(x => [x.Name, x.Value]));
        tx.mpesaReceipt = meta.MpesaReceiptNumber || '';
        tx.paidAmount = meta.Amount || tx.amount;
        tx.paidPhone = meta.PhoneNumber || tx.phone;
        tx.transactionDate = meta.TransactionDate || '';
      }
      tx.updatedAt = new Date().toISOString();
      await writeTx(items);
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (e) {
    console.error('Callback error:', e);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

app.get('/api/payments/status/:checkoutRequestId', async (req, res) => {
  const items = await readTx();
  const tx = items.find(x => x.checkoutRequestId === req.params.checkoutRequestId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({
    status: tx.status,
    transactionId: tx.transactionId,
    phone: tx.paidPhone || tx.phone,
    mpesaReceipt: tx.mpesaReceipt || '',
    resultDescription: tx.resultDescription || ''
  });
});

app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Tusome EduShelf running at http://localhost:${PORT}`));
