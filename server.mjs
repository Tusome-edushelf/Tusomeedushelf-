import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '18mb' }));

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

async function callGemini({ subject, grade, mode, focus, prompt, file }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

  // Stable multimodal models that are currently listed by Google.
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash')
    .split(',').map(x => x.trim()).filter(Boolean);
  const models = [...new Set([primaryModel, ...fallbackModels])];

  const paperMode = mode === 'paper';
  const system = `You are the main academic question-answering engine for Tusome EduShelf.
Your job is to answer the EXACT question or uploaded question paper correctly.

CORE RULES:
- Ignore the selected grade as a restriction on what you can solve. The grade is only optional context.
- Do NOT force CBC, KICD, CBE, strands, sub-strands, learning outcomes, competencies, values, or teacher/parent notes into ordinary answers unless the user explicitly asks for curriculum alignment.
- Never replace an algebraic question with a simpler "mystery number" or another grade-level version.
- Never change the numbers, symbols, units, wording, or requested operation in the question.
- Do not invent missing information. If part of a question cannot be read, identify the exact question/sub-question and say it cannot be read clearly.
- Internally check every calculation before giving the final answer.
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

${paperMode ? `UPLOADED QUESTION-PAPER MODE:
1. Read the entire uploaded paper carefully, including every visible page, diagram, table, graph, formula, and handwritten/printed sub-question.
2. Solve ALL readable questions unless the user asks for a specific number.
3. Preserve the original question numbering and sub-question labels exactly as shown (for example 27(a), 27(b), 28(i), 28(ii)). Never turn a sub-question into a new top-level question.
4. Do not skip a readable question. If the paper contains pages, process them in order.
5. For diagrams, use the visual information in the uploaded page. Do not guess dimensions or labels that are not visible.
6. For calculations, show only the necessary working and final answer, neatly arranged.
7. For theory, definitions, and multiple choice, give direct answers.
8. Before responding, silently verify arithmetic, signs, units, ratios, percentages, formulas, and copied question numbers.
9. If OCR/text extraction is uncertain but the visual page makes the question readable, use the visual page instead of guessing from garbled text.
10. If a question truly cannot be read, write: "[Question number] — Cannot read the question clearly from the uploaded page." Do not fabricate an answer.
11. Do not add curriculum explanations or teacher/parent notes.
` : ''}
Selected subject: ${subject || 'General'}. Selected grade: ${grade || 'General'}.`;

  const userPrompt = String(prompt || '').trim() || (paperMode ? 'Solve the uploaded question paper.' : 'Answer the uploaded question.');
  if (!userPrompt && !file) throw new Error('Enter a question or upload a question paper first.');

  const parts = [];
  if (file?.data && file?.mimeType) {
    const mime = String(file.mimeType).toLowerCase();
    const allowed = ['application/pdf','image/png','image/jpeg','image/webp','image/heic','image/heif'];
    if (!allowed.includes(mime)) throw new Error('Upload a PDF or image (PNG, JPG, WEBP, HEIC, or HEIF).');
    const raw = String(file.data).replace(/^data:[^;]+;base64,/, '');
    const bytes = Math.floor(raw.length * 3 / 4);
    if (bytes > 12 * 1024 * 1024) throw new Error('That file is too large for Tusome EduShelf. Please upload a file smaller than 12 MB.');
    // Put the visual/document part before the instruction text so the model can inspect it first.
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

app.post('/api/ai', async (req, res) => {
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
