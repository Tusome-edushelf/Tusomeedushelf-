import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
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

// Step 2 database connection. Render provides DATABASE_URL for the PostgreSQL service.
// The file store remains only as a temporary migration/development fallback.
const DATABASE_URL = process.env.DATABASE_URL || '';
const db = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
}) : null;

let databaseReady = false;

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

async function findUser(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const fromDb = await dbFindUser(normalized);
  if (fromDb) return fromDb;
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


async function initDatabase() {
  if (!db) {
    console.warn('DATABASE_URL is not configured. Running with the temporary file store only.');
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('learner','teacher','admin')),
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT,
      grade TEXT,
      strand TEXT,
      competency TEXT,
      topic TEXT,
      file_name TEXT,
      file_type TEXT,
      file_size BIGINT,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      description TEXT,
      teacher_email TEXT,
      file_id TEXT,

      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      checkout_request_id TEXT UNIQUE,
      merchant_request_id TEXT,
      material_id TEXT,
      title TEXT,
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      result_code INTEGER,
      result_description TEXT,
      mpesa_receipt TEXT,
      paid_amount NUMERIC(12,2),
      paid_phone TEXT,
      transaction_date TEXT,
      user_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_id TEXT;

    CREATE INDEX IF NOT EXISTS idx_materials_approval_status ON materials (approval_status);
    CREATE INDEX IF NOT EXISTS idx_materials_teacher_email ON materials (teacher_email);

    CREATE TABLE IF NOT EXISTS material_files (
      file_id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL UNIQUE REFERENCES materials(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      file_data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON transactions (user_email);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
  `);

  // Seed/update the three current demo accounts from Render environment variables.
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@edushelf.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const learnerPassword = process.env.DEMO_LEARNER_PASSWORD || 'learner123';
  const teacherPassword = process.env.DEMO_TEACHER_PASSWORD || 'teacher123';
  const seeds = [
    { email: adminEmail, role: 'admin', passwordHash: hashPassword(adminPassword, 'edushelf-admin-salt-v1') },
    { email: 'learner@edushelf.com', role: 'learner', passwordHash: hashPassword(learnerPassword, 'edushelf-learner-salt-v1') },
    { email: 'teacher@edushelf.com', role: 'teacher', passwordHash: hashPassword(teacherPassword, 'edushelf-teacher-salt-v1') }
  ];
  for (const user of seeds) {
    await db.query(`
      INSERT INTO users (email, role, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, updated_at = NOW()
    `, [user.email, user.role, user.passwordHash]);
  }

  // One-time migration of the old JSON transaction file into PostgreSQL.
  const legacy = await readTx();
  for (const tx of legacy) {
    await db.query(`
      INSERT INTO transactions
        (transaction_id, checkout_request_id, merchant_request_id, material_id, title, amount, phone,
         status, result_code, result_description, mpesa_receipt, paid_amount, paid_phone, transaction_date,
         created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (transaction_id) DO NOTHING
    `, [
      String(tx.transactionId || `TX-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
      tx.checkoutRequestId || null,
      tx.merchantRequestId || null,
      tx.materialId || null,
      tx.title || null,
      Number(tx.amount || 0),
      tx.phone || null,
      tx.status || 'pending',
      Number.isFinite(Number(tx.resultCode)) ? Number(tx.resultCode) : null,
      tx.resultDescription || null,
      tx.mpesaReceipt || null,
      tx.paidAmount != null ? Number(tx.paidAmount) : null,
      tx.paidPhone || null,
      tx.transactionDate || null,
      tx.createdAt ? new Date(tx.createdAt) : new Date(),
      tx.updatedAt ? new Date(tx.updatedAt) : new Date()
    ]);
  }

  databaseReady = true;
  console.log('PostgreSQL connected and EduShelf schema is ready.');
}

async function dbFindUser(email) {
  if (!db || !databaseReady) return null;
  const result = await db.query('SELECT email, role, password_hash AS "passwordHash" FROM users WHERE email = $1 LIMIT 1', [String(email || '').trim().toLowerCase()]);
  return result.rows[0] || null;
}

async function dbCreateTransaction(tx, userEmail = null) {
  if (!db || !databaseReady) return false;
  await db.query(`
    INSERT INTO transactions
      (transaction_id, checkout_request_id, merchant_request_id, material_id, title, amount, phone, status, user_email, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
    ON CONFLICT (transaction_id) DO UPDATE SET
      checkout_request_id = EXCLUDED.checkout_request_id,
      merchant_request_id = EXCLUDED.merchant_request_id,
      material_id = EXCLUDED.material_id,
      title = EXCLUDED.title,
      amount = EXCLUDED.amount,
      phone = EXCLUDED.phone,
      status = EXCLUDED.status,
      user_email = COALESCE(EXCLUDED.user_email, transactions.user_email),
      updated_at = NOW()
  `, [tx.transactionId, tx.checkoutRequestId || null, tx.merchantRequestId || null, tx.materialId || null, tx.title || null, Number(tx.amount || 0), tx.phone || null, tx.status || 'pending', userEmail, tx.createdAt ? new Date(tx.createdAt) : new Date()]);
  return true;
}

async function dbUpdateTransaction(checkoutRequestId, patch) {
  if (!db || !databaseReady) return false;
  await db.query(`
    UPDATE transactions SET
      status = COALESCE($2, status),
      result_code = $3,
      result_description = $4,
      mpesa_receipt = $5,
      paid_amount = $6,
      paid_phone = $7,
      transaction_date = $8,
      updated_at = NOW()
    WHERE checkout_request_id = $1
  `, [checkoutRequestId, patch.status || null, patch.resultCode ?? null, patch.resultDescription || null, patch.mpesaReceipt || null, patch.paidAmount ?? null, patch.paidPhone || null, patch.transactionDate || null]);
  return true;
}

async function dbGetTransaction(checkoutRequestId, user) {
  if (!db || !databaseReady) return null;
  const isAdmin = user?.role === 'admin';
  const result = isAdmin
    ? await db.query(`
        SELECT transaction_id AS "transactionId", status, phone, paid_phone AS "paidPhone",
               mpesa_receipt AS "mpesaReceipt", result_description AS "resultDescription", user_email AS "userEmail"
        FROM transactions WHERE checkout_request_id = $1 LIMIT 1
      `, [checkoutRequestId])
    : await db.query(`
        SELECT transaction_id AS "transactionId", status, phone, paid_phone AS "paidPhone",
               mpesa_receipt AS "mpesaReceipt", result_description AS "resultDescription", user_email AS "userEmail"
        FROM transactions WHERE checkout_request_id = $1 AND user_email = $2 LIMIT 1
      `, [checkoutRequestId, user?.email || '']);
  return result.rows[0] || null;
}

async function dbGetPaidMaterials(userEmail) {
  if (!db || !databaseReady) return [];
  const result = await db.query(`
    SELECT material_id AS "materialId", title, transaction_id AS "transactionId", amount,
           mpesa_receipt AS "mpesaReceipt", created_at AS "createdAt"
    FROM transactions
    WHERE user_email = $1 AND status = 'paid' AND material_id IS NOT NULL
    ORDER BY created_at DESC
  `, [userEmail]);
  return result.rows;
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
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();

  // In sandbox, always use the standard Daraja STK test shortcode/passkey.
  // This intentionally ignores any manually entered MPESA_SHORTCODE/MPESA_PASSKEY
  // values in Render so an invalid value cannot override the sandbox test pair.
  if (env === 'sandbox' && (name === 'MPESA_SHORTCODE' || name === 'MPESA_PASSKEY')) {
    const sandboxDefaults = {
      MPESA_SHORTCODE: '174379',
      MPESA_PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    };
    return sandboxDefaults[name];
  }

  const v = process.env[name];
  if (v) return String(v).trim();
  throw new Error(`Missing ${name} in Render environment variables.`);
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

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  const user = await findUser(email);
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


function requireRole(...roles) {
  return (req, res, next) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: 'Please log in to continue.' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    req.user = user;
    next();
  };
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+)?;base64,(.+)$/s);
  if (!match) throw new Error('Invalid uploaded file data.');
  return { mimeType: match[1] || 'application/octet-stream', buffer: Buffer.from(match[2], 'base64') };
}

app.get('/api/materials', requireAuth, async (req, res) => {
  if (!databaseReady) return res.status(503).json({ error: 'Database is not ready.' });
  try {
    let sql = `SELECT id,title,subject,grade,strand,competency,topic,file_name AS file,"file_type" AS "fileType",file_size AS "fileSize",price,approval_status AS "approvalStatus",description,teacher_email AS "teacherEmail",file_id AS "fileId",approved_at AS "approvedAt",created_at AS "createdAt" FROM materials`;
    const params = [];
    if (req.user.role === 'learner') {
      sql += ` WHERE approval_status = 'approved'`;
    } else if (req.user.role === 'teacher') {
      sql += ` WHERE teacher_email = $1`;
      params.push(req.user.email);
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await db.query(sql, params);
    res.json({ ok: true, materials: result.rows });
  } catch (e) {
    console.error('Materials list error:', e);
    res.status(500).json({ error: 'Could not load learning materials.' });
  }
});

app.post('/api/materials', requireRole('teacher'), async (req, res) => {
  if (!databaseReady) return res.status(503).json({ error: 'Database is not ready.' });
  try {
    const { title, subject, grade, strand, competency, topic, price, description, file } = req.body || {};
    if (!title || !topic || !file?.data || !file?.name) return res.status(400).json({ error: 'Title, topic and a file are required.' });
    const { mimeType, buffer } = decodeDataUrl(file.data);
    if (!buffer.length) return res.status(400).json({ error: 'The uploaded file is empty.' });
    if (buffer.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'Please keep each learning material below 12 MB.' });
    const id = `MAT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const fileId = `FILE-${crypto.randomBytes(12).toString('hex')}`;
    await db.query('BEGIN');
    await db.query(`INSERT INTO materials (id,title,subject,grade,strand,competency,topic,file_name,file_type,file_size,price,approval_status,description,teacher_email,file_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13,$14)`, [id, String(title).trim(), subject || null, grade || null, strand || null, competency || null, topic || null, file.name, mimeType, buffer.length, Math.max(0, Number(price || 0)), description || null, req.user.email, fileId]);
    await db.query(`INSERT INTO material_files (file_id,material_id,file_name,mime_type,file_size,file_data) VALUES ($1,$2,$3,$4,$5,$6)`, [fileId, id, file.name, mimeType, buffer.length, buffer]);
    await db.query('COMMIT');
    res.status(201).json({ ok: true, material: { id, title: String(title).trim(), subject, grade, strand, competency, topic, file: file.name, fileType: mimeType, fileSize: buffer.length, price: Math.max(0, Number(price || 0)), approvalStatus: 'pending', description, teacherEmail: req.user.email, fileId } });
  } catch (e) {
    try { await db.query('ROLLBACK'); } catch {}
    console.error('Material upload error:', e);
    res.status(500).json({ error: 'Could not save the learning material.' });
  }
});

app.get('/api/materials/:id/file', requireAuth, async (req, res) => {
  if (!databaseReady) return res.status(503).json({ error: 'Database is not ready.' });
  try {
    const result = await db.query(`SELECT m.approval_status AS "approvalStatus",m.teacher_email AS "teacherEmail",f.file_name AS "fileName",f.mime_type AS "mimeType",f.file_data AS "fileData" FROM materials m JOIN material_files f ON f.material_id=m.id WHERE m.id=$1 LIMIT 1`, [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Material file not found.' });
    const allowed = req.user.role === 'admin' || (req.user.role === 'teacher' && row.teacherEmail === req.user.email) || (req.user.role === 'learner' && row.approvalStatus === 'approved');
    if (!allowed) return res.status(403).json({ error: 'This material is not available to your account.' });
    res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${String(row.fileName).replace(/"/g, '')}"`);
    res.send(row.fileData);
  } catch (e) {
    console.error('Material file error:', e);
    res.status(500).json({ error: 'Could not open the learning material.' });
  }
});

app.patch('/api/materials/:id/review', requireRole('admin'), async (req, res) => {
  if (!databaseReady) return res.status(503).json({ error: 'Database is not ready.' });
  const status = String(req.body?.approvalStatus || '').toLowerCase();
  if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid approval status.' });
  const price = Math.max(0, Number(req.body?.price ?? 0));
  try {
    const result = await db.query(`UPDATE materials SET approval_status=$2,price=$3,approved_at=CASE WHEN $2='approved' THEN NOW() ELSE NULL END,updated_at=NOW() WHERE id=$1 RETURNING id,title,price,approval_status AS "approvalStatus",approved_at AS "approvedAt"`, [req.params.id, status, price]);
    if (!result.rowCount) return res.status(404).json({ error: 'Material not found.' });
    res.json({ ok: true, material: result.rows[0] });
  } catch (e) {
    console.error('Material review error:', e);
    res.status(500).json({ error: 'Could not update the material.' });
  }
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
  const env = (process.env.MPESA_ENV || 'sandbox').toLowerCase();
  const required = ['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_CALLBACK_URL'];
  const missing = required.filter(name => !process.env[name]);
  const sandboxDefaults = env === 'sandbox';
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    ok: true,
    daraja: env,
    configured: missing.length === 0,
    missing,
    shortcodeSource: process.env.MPESA_SHORTCODE ? 'render_env' : (sandboxDefaults ? 'sandbox_default' : 'missing'),
    passkeySource: process.env.MPESA_PASSKEY ? 'render_env' : (sandboxDefaults ? 'sandbox_default' : 'missing'),
    ai: { configured: aiConfigured, provider: 'Gemini', model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash').split(',').map(x => x.trim()).filter(Boolean) },
    database: { configured: Boolean(DATABASE_URL), connected: databaseReady, provider: 'PostgreSQL' }
  });
});

app.post('/api/payments/stkpush', requireRole('learner'), async (req, res) => {
  try {
    if (!databaseReady) return res.status(503).json({ error: 'Payment database is not ready.' });
    const { materialId, phone } = req.body || {};
    if (!materialId) return res.status(400).json({ error: 'A material is required.' });

    // Never trust title or amount sent by the browser. Read the approved price from PostgreSQL.
    const materialResult = await db.query(`
      SELECT id, title, price, approval_status AS "approvalStatus"
      FROM materials WHERE id = $1 LIMIT 1
    `, [String(materialId)]);
    const material = materialResult.rows[0];
    if (!material) return res.status(404).json({ error: 'Material not found.' });
    if (material.approvalStatus !== 'approved') return res.status(403).json({ error: 'This material is not approved for purchase.' });
    const numericAmount = Math.round(Number(material.price));
    if (!Number.isFinite(numericAmount) || numericAmount < 1) return res.status(400).json({ error: 'This material is free and does not require payment.' });

    const existing = await db.query(`SELECT 1 FROM transactions WHERE user_email=$1 AND material_id=$2 AND status='paid' LIMIT 1`, [req.user.email, material.id]);
    if (existing.rowCount) return res.status(409).json({ error: 'You have already purchased this material.' });

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
      AccountReference: String(material.id).slice(0, 12),
      TransactionDesc: `Tusome EduShelf: ${String(material.title).slice(0, 80)}`
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
      materialId: material.id, title: material.title, amount: numericAmount, phone: normalizedPhone,
      status: 'pending', createdAt: new Date().toISOString()
    };
    if (databaseReady) await dbCreateTransaction(tx, req.user?.email || null);
    else {
      const items = await readTx();
      items.unshift(tx);
      await writeTx(items);
    }

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

    const resultCode = Number(stk.ResultCode);
    const meta = Object.fromEntries((stk.CallbackMetadata?.Item || []).map(x => [x.Name, x.Value]));
    const patch = {
      status: resultCode === 0 ? 'paid' : 'failed',
      resultCode,
      resultDescription: stk.ResultDesc || '',
      mpesaReceipt: resultCode === 0 ? (meta.MpesaReceiptNumber || '') : null,
      paidAmount: resultCode === 0 ? (meta.Amount ?? null) : null,
      paidPhone: resultCode === 0 ? (meta.PhoneNumber || '') : null,
      transactionDate: resultCode === 0 ? (meta.TransactionDate || '') : null
    };
    if (databaseReady) {
      await dbUpdateTransaction(stk.CheckoutRequestID, patch);
    } else {
      const items = await readTx();
      const tx = items.find(x => x.checkoutRequestId === stk.CheckoutRequestID);
      if (tx) {
        Object.assign(tx, patch, { updatedAt: new Date().toISOString() });
        await writeTx(items);
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (e) {
    console.error('Callback error:', e);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

app.get('/api/payments/status/:checkoutRequestId', requireAuth, async (req, res) => {
  const tx = databaseReady
    ? await dbGetTransaction(req.params.checkoutRequestId, req.user)
    : (await readTx()).find(x => x.checkoutRequestId === req.params.checkoutRequestId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({
    status: tx.status,
    transactionId: tx.transactionId,
    phone: tx.paidPhone || tx.phone,
    mpesaReceipt: tx.mpesaReceipt || '',
    resultDescription: tx.resultDescription || ''
  });
});

app.get('/api/payments/my', requireRole('learner'), async (req, res) => {
  if (!databaseReady) return res.status(503).json({ error: 'Payment database is not ready.' });
  try {
    const purchases = await dbGetPaidMaterials(req.user.email);
    res.json({ ok: true, purchases });
  } catch (e) {
    console.error('Purchase list error:', e);
    res.status(500).json({ error: 'Could not load your purchases.' });
  }
});

app.use(express.static(__dirname));

try {
  await initDatabase();
} catch (e) {
  console.error('PostgreSQL initialization failed:', e.message);
  console.warn('The server will continue, but database-backed features will use the temporary file fallback until the database is reachable.');
}

app.listen(PORT, () => console.log(`Tusome EduShelf running at http://localhost:${PORT}`));
