import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '18mb' }));

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const TX_FILE = path.join(DATA_DIR, 'transactions.json');

const AUTH_COOKIE = 'tusome_session';
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.AUTH_SESSION_SECRET) {
  console.warn('AUTH_SESSION_SECRET is not configured. A temporary secret will be generated and sessions will reset when the server restarts.');
}

function b64url(value) { return Buffer.from(value).toString('base64url'); }

function signSession(payload) {
  const encoded = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', AUTH_SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySession(token) {
  try {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac('sha256', AUTH_SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(signature); const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.email || !payload?.role || Number(payload.exp) < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function setSessionCookie(res, user) {
  const token = signSession({ email: user.email, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function currentUser(req) { return verifySession(getCookie(req, AUTH_COOKIE)); }

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in to continue.' });
  req.user = user;
  next();
}

function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  return `${actualSalt}:${crypto.scryptSync(String(password), actualSalt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, expectedHex] = String(stored || '').split(':');
    if (!salt || !expectedHex) return false;
    const actual = crypto.scryptSync(String(password), salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}

function authUsers() {
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@edushelf.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const learnerPassword = process.env.DEMO_LEARNER_PASSWORD || 'learner123';
  const teacherPassword = process.env.DEMO_TEACHER_PASSWORD || 'teacher123';
  if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not configured. Temporary default admin password is active; set ADMIN_PASSWORD in Render immediately.');
  return [
    { email: adminEmail, role: 'admin', passwordHash: hashPassword(adminPassword, 'edushelf-admin-salt-v1') },
    { email: 'learner@edushelf.com', role: 'learner', passwordHash: hashPassword(learnerPassword, 'edushelf-learner-salt-v1') },
    { email: 'teacher@edushelf.com', role: 'teacher', passwordHash: hashPassword(teacherPassword, 'edushelf-teacher-salt-v1') }
  ];
}

function findUser(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return authUsers().find(u => u.email === normalized);
}

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

async function callGemini({ subject, grade, mode, focus, prompt, file, questionFile, workingFile }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

  // Stable multimodal models that are currently listed by Google.
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash')
    .split(',').map(x => x.trim()).filter(Boolean);
  const models = [...new Set([primaryModel, ...fallbackModels])];

  const paperMode = mode === 'paper';
  const markMode = mode === 'mark';
  const system = `You are the main academic question-answering engine for Tusome EduShelf.
Your job is to answer the EXACT question or uploaded question paper correctly.

CORE RULES:
- Ignore the selected grade as a restriction on what you can solve. The grade is only optional context.
- Do NOT force CBC, KICD, CBE, strands, sub-strands, learning outcomes, competencies, values, or teacher/parent notes into ordinary answers unless the user explicitly asks for curriculum alignment.
- Never replace an algebraic question with a simpler "mystery number" or another grade-level version.
- Never change the numbers, symbols, units, wording, or requested operation in the question.
- Do not invent missing information. If part of a question cannot be read, identify the exact question/sub-question and say it cannot be read clearly.
- Internally check every calculation before giving the final answer.
- For numerical answers, independently recompute the result using a second check before displaying it.
- Check copied values, signs, decimal points, fractions, ratios, percentages, units, and the final operation.
- For equations, substitute the final value back into the original equation when practical and correct it if the check fails.
- For geometry and measurement questions, verify the selected formula matches the shape and the requested quantity before calculating.
- For ratios and percentages, verify the result against the original total/base before displaying it.
- If a calculation depends on an unreadable symbol, number, diagram label, or unit, do not silently assume it; identify the uncertainty.
- Use the same units as the question and convert units only when necessary.
- Keep answers concise but complete. Do not add motivational text, tips, summaries, common mistakes, or unrelated explanations unless requested.

CALCULATION FORMAT:
Use a clean arrangement such as:
Given:
...

Formula:
...

Substitution:
...

Calculation:
...

Answer:
...
Use only the sections that are useful. For simple calculations, omit unnecessary sections.
Show one mathematical step per line. Keep operations in a natural order and make the final answer unmistakable.
Do not use LaTeX delimiters such as $$, \\( \\), or \\[ \\]. Plain text math is preferred for phone readability.

THEORY:
Give the direct correct answer. For definitions, give the definition directly.

MULTIPLE CHOICE:
Give the option letter/number and the answer. Do not list all options unless needed.

ESSAYS:
Give a complete, well-organized answer appropriate to the question.

${markMode ? `MARK MY WORK MODE:
1. Read the uploaded question and the learner's working carefully, using the visual page rather than relying on garbled OCR.
2. Mark the learner's work against the actual question. Do not change the question to fit the selected grade.
3. For each readable question/sub-question, identify whether the learner's answer/step is correct, partially correct, or incorrect.
4. Preserve the original question and sub-question numbering exactly as visible.
5. For calculations, verify each important step, signs, operations, formulas, units, substitutions, and the final answer.
6. If a step is wrong, show the corrected step and continue from the correct point. Do not hide the learner's mistake.
7. If the final answer is wrong, provide the correct final answer.
8. If the learner's answer is correct, clearly say so and do not invent a correction.
9. If the uploaded working is unclear, identify the exact part that cannot be read and do not guess.
10. Do not force CBC/KICD/CBE explanations unless the learner explicitly asks for curriculum alignment.
11. Keep the marking concise but useful. Do not add unrelated tips, summaries, teacher/parent notes, or motivational text.
12. Use this format where useful:
Question [number]
Status: Correct / Partly correct / Incorrect
Working check:
...
Correction:
...
Final answer: ...
` : ''}
${paperMode ? `UPLOADED QUESTION-PAPER MODE:
1. Read the entire uploaded paper carefully, including every visible page, diagram, table, graph, formula, and handwritten/printed sub-question.
2. Solve ALL readable questions unless the user asks for a specific number.
3. Preserve the original question numbering and sub-question labels exactly as shown (for example 27(a), 27(b), 28(i), 28(ii)). Never turn a sub-question into a new top-level question.
4. Do not skip a readable question. If the paper contains pages, process them in order.
5. For diagrams, use the visual information in the uploaded page. Do not guess dimensions or labels that are not visible.
6. For calculations, show only the necessary working and final answer, neatly arranged.
7. For theory, definitions, and multiple choice, give direct answers.
8. Before responding, perform a final quality-control pass: confirm every original question/sub-question is present, confirm numbering is unchanged, recompute every numerical answer, and check that each final answer matches its working.
9. For each calculation, silently do a second independent check (for example substitution, reverse operation, total check, unit check, or estimation) and fix any mismatch before responding.
10. If OCR/text extraction is uncertain but the visual page makes the question readable, use the visual page instead of guessing from garbled text.
11. If a question truly cannot be read, write: "[Question number] — Cannot read the question clearly from the uploaded page." Do not fabricate an answer.
12. Do not add curriculum explanations or teacher/parent notes.
` : ''}
Selected subject: ${subject || 'General'}. Selected grade: ${grade || 'General'}.`;

  const userPrompt = String(prompt || '').trim() || (paperMode ? 'Solve the uploaded question paper.' : markMode ? 'Mark the learner’s uploaded working against the uploaded question paper.' : 'Answer the uploaded question.');
  if (!userPrompt && !file && !questionFile && !workingFile) throw new Error('Enter a question or upload a question paper first.');

  const parts = [];
  const uploads = [];
  if (questionFile?.data && questionFile?.mimeType) uploads.push({label:'QUESTION PAPER', file:questionFile});
  else if (file?.data && file?.mimeType) uploads.push({label:'QUESTION PAPER', file});
  if (workingFile?.data && workingFile?.mimeType) uploads.push({label:'LEARNER WORKING', file:workingFile});
  for (const upload of uploads) {
    const mime = String(upload.file.mimeType).toLowerCase();
    const allowed = ['application/pdf','image/png','image/jpeg','image/webp','image/heic','image/heif'];
    if (!allowed.includes(mime)) throw new Error('Upload a PDF or image (PNG, JPG, WEBP, HEIC, or HEIF).');
    const raw = String(upload.file.data).replace(/^data:[^;]+;base64,/, '');
    const bytes = Math.floor(raw.length * 3 / 4);
    if (bytes > 12 * 1024 * 1024) throw new Error(`The ${upload.label.toLowerCase()} is too large. Please upload a file smaller than 12 MB.`);
    parts.push({ text: `--- ${upload.label} ---` });
    parts.push({ inline_data: { mime_type: mime, data: raw } });
  }
  parts.push({ text: `${system}\n\nUSER REQUEST:\n${userPrompt}` });

  const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);
  const maxRetriesPerModel = Math.max(1, Math.min(3, Number(process.env.GEMINI_RETRIES || 2)));
  const baseDelayMs = Math.max(700, Number(process.env.GEMINI_RETRY_DELAY_MS || 1500));
  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.9
            }
          })
        });
        const rawResponse = await response.text();
        let data;
        try { data = JSON.parse(rawResponse); }
        catch { throw new Error(`Gemini returned a non-JSON response (${response.status}).`); }

        if (!response.ok) {
          const message = data?.error?.message || `Gemini request failed (${response.status}).`;
          const err = new Error(message);
          err.status = response.status;
          throw err;
        }

        const answer = (data.candidates || [])
          .flatMap(c => c.content?.parts || [])
          .map(p => p.text || '')
          .join('\n')
          .trim();
        if (!answer) throw new Error('Gemini returned no text response.');
        return answer;
      } catch (err) {
        lastError = err;
        const status = Number(err?.status || 0);
        const transient = transientStatuses.has(status) || /high demand|temporarily|unavailable|overloaded|rate limit|resource exhausted/i.test(err?.message || '');
        if (!transient) throw err;
        if (attempt < maxRetriesPerModel) {
          const delay = Math.min(12000, baseDelayMs * (2 ** attempt));
          console.warn(`Gemini ${model} busy (attempt ${attempt + 1}/${maxRetriesPerModel + 1}); retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.warn(`Gemini ${model} exhausted retries; trying the next fallback model.`);
  }

  throw new Error(`Gemini is temporarily busy. Automatic fallback was attempted across ${models.length} models. Please try again shortly. Last error: ${lastError?.message || 'unknown error'}`);
}

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {};
  const user = findUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password.' });
  if (!['learner', 'teacher', 'admin'].includes(String(role)) || user.role !== role) return res.status(403).json({ error: 'The selected account type does not match this account.' });
  setSessionCookie(res, user);
  res.json({ ok: true, user: { email: user.email, role: user.role } });
});

app.get('/api/auth/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in.' });
  res.json({ ok: true, user: { email: user.email, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/ai', requireAuth, async (req, res) => {
  try {
    const answer = await callGemini(req.body || {});
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
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const missing = required.filter(name => !process.env[name]);
  res.json({
    ok: true,
    daraja: process.env.MPESA_ENV || 'sandbox',
    configured: missing.length === 0,
    missing,
    ai: { configured: aiConfigured, provider: 'Gemini', model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash').split(',').map(x => x.trim()).filter(Boolean) }
  });
});

app.post('/api/payments/stkpush', requireAuth, async (req, res) => {
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

app.get('/api/payments/status/:checkoutRequestId', requireAuth, async (req, res) => {
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
