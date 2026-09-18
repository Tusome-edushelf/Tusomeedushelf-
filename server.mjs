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
  const selectedMode = mode || 'answer';
  const cbe = focus ? `\nCBE focus: ${focus}` : '';
  const header = `Tusome EduShelf Local Study Assistant\nSubject: ${subj} | Grade: ${g}\nMode: ${selectedMode}${cbe}\n\n`;

  const pack = (title, definition, concepts, steps, example, realLife, mistakes, check, diagram) => ({title, definition, concepts, steps, example, realLife, mistakes, check, diagram});
  let lesson;

  if (/linear equation/.test(low)) {
    lesson = pack(
      'Linear Equations',
      'A linear equation is an equation in which the highest power of the variable is 1. The goal is to find the value of the unknown while keeping both sides equal.',
      ['Variable: the unknown value, often represented by x or y.', 'Coefficient: the number multiplying a variable.', 'Constant: a number without a variable.', 'Equality sign (=): shows that the two sides have the same value.'],
      ['Simplify each side if necessary.', 'Use the same operation on both sides of the equation.', 'Move the constant term away from the variable.', 'Divide or multiply to make the variable stand alone.', 'Substitute the answer back into the original equation to check it.'],
      'Solve 2x + 3 = 11:\n1. Subtract 3 from both sides: 2x = 8.\n2. Divide both sides by 2: x = 4.\n3. Check: 2(4) + 3 = 11 ✓',
      'If a taxi charges a fixed booking fee of KSh 3 and KSh 2 per kilometre, a total of KSh 11 can be represented by 2x + 3 = 11, where x is the number of kilometres.',
      ['Changing only one side of an equation.', 'Forgetting the negative sign when moving a term.', 'Dividing one term instead of the whole side.', 'Not checking the final answer.'],
      'Substitute the value of the variable into the original equation. If both sides have the same value, the solution is correct.',
      'balance'
    );
  } else if (/linear function/.test(low)) {
    lesson = pack(
      'Linear Functions',
      'A linear function is commonly written as y = mx + c, where m is the gradient (slope) and c is the y-intercept.',
      ['Gradient tells how much y changes when x increases by 1.', 'Y-intercept is the value of y when x = 0.', 'The graph of a linear function is a straight line.'],
      ['Identify m and c.', 'Choose several x-values.', 'Calculate the corresponding y-values.', 'Plot the ordered pairs (x, y).', 'Join the points with a straight line.'],
      'For y = 2x + 1:\nx = 0 → y = 1\nx = 1 → y = 3\nx = 2 → y = 5.\nThe points lie on one straight line.',
      'A savings plan that increases by the same amount every week can be represented by a linear function.',
      ['Confusing gradient with intercept.', 'Using inconsistent scales on a graph.', 'Plotting (x,y) in the wrong order.'],
      'Pick one plotted point and substitute its x-value into the equation. The calculated y-value should match the graph.',
      'graph'
    );
  } else if (/fraction/.test(low)) {
    lesson = pack(
      'Fractions',
      'A fraction represents a part of a whole or a number divided by another number. In a/b, a is the numerator and b is the denominator, with b ≠ 0.',
      ['Numerator: parts being considered.', 'Denominator: equal parts making the whole.', 'Proper fraction: numerator is smaller than denominator.', 'Equivalent fractions have the same value.'],
      ['For addition/subtraction, find a common denominator when denominators differ.', 'Convert to equivalent fractions.', 'Perform the operation on the numerators.', 'Simplify the result where possible.'],
      'Add 2/7 + 3/7:\nThe denominators are already equal.\n2/7 + 3/7 = 5/7.',
      'If 2 out of 7 equal pieces of a cake are eaten and another 3 out of 7 are eaten, 5/7 of the cake has been eaten.',
      ['Adding denominators when adding fractions.', 'Forgetting to find a common denominator.', 'Failing to simplify the final answer.'],
      'Estimate whether the fraction is reasonable. For example, adding two positive fractions should not produce a negative answer.',
      'fraction'
    );
  } else if (/magnification/.test(low)) {
    lesson = pack(
      'Magnification',
      'Magnification compares the size of an image with the actual size of the object.',
      ['Magnification has no unit.', 'Image size and actual size must be in the same units before dividing.', 'A magnification greater than 1 means the image is larger than the actual object.'],
      ['Write the formula: Magnification = image size ÷ actual size.', 'Convert both measurements to the same unit.', 'Substitute the values.', 'Calculate and state the magnification.'],
      'If an image is 30 mm long and the actual object is 5 mm long:\nMagnification = 30 ÷ 5 = 6×.',
      'Microscopes produce enlarged images so that small biological structures can be observed more easily.',
      ['Mixing centimetres and millimetres.', 'Reversing image size and actual size.', 'Adding the two measurements instead of dividing.'],
      'Multiply actual size by magnification. The result should equal the image size.',
      'magnification'
    );
  } else if (/photosynthesis/.test(low)) {
    lesson = pack(
      'Photosynthesis',
      'Photosynthesis is the process by which green plants use light energy to make glucose from carbon dioxide and water. Chlorophyll captures light energy, and oxygen is released.',
      ['Raw materials: carbon dioxide and water.', 'Energy source: light.', 'Pigment: chlorophyll.', 'Main food product: glucose.', 'Oxygen is released as a by-product.'],
      ['Light is absorbed by chlorophyll.', 'Roots absorb water.', 'Carbon dioxide enters mainly through stomata.', 'The plant uses light energy to form glucose.', 'Oxygen is released.'],
      'Word equation:\nCarbon dioxide + water —light/chlorophyll→ glucose + oxygen.',
      'Photosynthesis provides food for plants and is the starting point for much of the energy available in food chains.',
      ['Saying plants obtain food from the soil.', 'Leaving out light or chlorophyll.', 'Confusing respiration with photosynthesis.'],
      'Ask: What are the raw materials, what provides energy, and what products are formed?',
      'photosynthesis'
    );
  } else if (/\b(atom|molecule)s?\b/.test(low)) {
    lesson = pack(
      'Atoms and Molecules',
      'An atom is the smallest unit of an element that retains the chemical identity of that element. A molecule consists of two or more atoms chemically joined together.',
      ['Atoms contain protons, neutrons and electrons.', 'Elements contain one type of atom.', 'A molecule may contain atoms of the same element or different elements.', 'Water (H₂O) contains hydrogen and oxygen atoms.'],
      ['Identify the element or compound.', 'Count the atoms shown in a formula.', 'Distinguish individual atoms from chemically joined groups.', 'Use the chemical formula to communicate composition.'],
      'H₂O has 2 hydrogen atoms and 1 oxygen atom in each molecule.',
      'Understanding atoms and molecules helps explain materials, chemical reactions and everyday substances such as water, oxygen and carbon dioxide.',
      ['Calling a molecule a single atom.', 'Ignoring the small number (subscript) in a chemical formula.', 'Assuming every molecule is a compound.'],
      'Count the symbols and subscripts in the formula and check whether the description matches.',
      'atoms'
    );
  } else if (/pythagoras|pythagorean/.test(low)) {
    lesson = pack(
      'Pythagorean Relationship',
      'In a right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c².',
      ['Hypotenuse: longest side, opposite the right angle.', 'The relationship applies to right-angled triangles.', 'The side c represents the hypotenuse in the standard formula.'],
      ['Identify the right angle.', 'Identify the hypotenuse.', 'Write a² + b² = c².', 'Substitute known lengths.', 'Solve for the unknown and check that the answer is positive.'],
      'If a = 3 and b = 4:\nc² = 3² + 4² = 9 + 16 = 25\nc = 5.',
      'The relationship can be used to calculate a missing distance when two sides of a right-angled triangle are known.',
      ['Using the wrong side as the hypotenuse.', 'Forgetting to square the lengths.', 'Stopping at c² instead of finding c.'],
      'Check that the longest side is the hypotenuse and that a² + b² equals c².',
      'pythagoras'
    );
  } else if (/speed|distance|time/.test(low)) {
    lesson = pack(
      'Speed, Distance and Time',
      'Speed describes how quickly distance is covered. The basic relationship is speed = distance ÷ time.',
      ['Speed = distance ÷ time.', 'Distance = speed × time.', 'Time = distance ÷ speed.', 'Units must be consistent.'],
      ['Identify what is known and what is required.', 'Choose the correct formula.', 'Convert units if necessary.', 'Substitute the values.', 'Calculate and include the correct unit.'],
      'A car travels 120 km in 2 hours:\nSpeed = 120 ÷ 2 = 60 km/h.',
      'Speed calculations are used in transport, athletics, travel planning and estimating arrival times.',
      ['Mixing minutes and hours.', 'Using the wrong formula.', 'Leaving out units.'],
      'Check using the related formula. For example, speed × time should give distance.',
      'speed'
    );
  } else if (/area of (a )?circle|circle/.test(low)) {
    lesson = pack(
      'Circles and Area',
      'The area of a circle is the amount of surface enclosed by the circle. The formula is A = πr², where r is the radius.',
      ['Radius: distance from the centre to the circumference.', 'Diameter: distance across the circle through its centre.', 'Diameter = 2 × radius.', 'Use the value of π required by the question, commonly 22/7 or 3.142.'],
      ['Identify the radius.', 'If diameter is given, divide it by 2.', 'Use A = πr².', 'Substitute and calculate.', 'Give the answer in square units.'],
      'If r = 7 cm:\nA = 22/7 × 7² = 154 cm².',
      'Area of a circle is useful when finding the surface covered by round objects such as circular gardens, plates or tanks.',
      ['Using diameter as r.', 'Forgetting to square the radius.', 'Writing cm instead of cm².'],
      'Check that the final unit is squared and compare the size with the circle radius.',
      'circle'
    );
  } else {
    lesson = pack(
      q,
      `This topic should be understood by connecting the main idea to a definition, key concepts, an example and an application. For this local assistant, a topic-specific explanation is available when the topic matches its built-in study guides.`,
      ['Identify the important terms in the question.', 'Separate facts, rules, formulas and examples.', 'Connect the concept to something familiar.', 'Use practice to test understanding.'],
      ['Read the question carefully.', 'Identify what is being asked.', 'Recall the relevant rule or concept.', 'Work through an example step by step.', 'Check the result and explain it in your own words.'],
      `Study example:\nStart with a simple example related to “${q}”, then change one value or condition and solve again.`,
      'Try to connect the topic to an everyday situation, school activity or observation.',
      ['Memorising without understanding.', 'Skipping working in calculations.', 'Not checking whether the final answer is reasonable.'],
      'Explain the idea in one or two sentences without looking at your notes, then solve a new example.',
      'study'
    );
  }

  let body = `📘 ${lesson.title}\n\nDEFINITION / MAIN IDEA\n${lesson.definition}\n\nKEY CONCEPTS\n${lesson.concepts.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nSTEP-BY-STEP METHOD\n${lesson.steps.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nWORKED EXAMPLE\n${lesson.example}\n\nREAL-LIFE APPLICATION\n${lesson.realLife}\n\nCOMMON MISTAKES TO AVOID\n${lesson.mistakes.map(x=>'• '+x).join('\n')}\n\nCHECK YOUR UNDERSTANDING\n${lesson.check}\n\n[DIAGRAM:${lesson.diagram}]\n\nQUICK SUMMARY\nRemember the definition, the main steps, the worked example and how to check your answer.`;

  if (selectedMode === 'notes') {
    body += `\n\nREVISION NOTES\n• Learn the definition and key terms.\n• Write the main formula or process from memory.\n• Review the worked example.\n• Create one example of your own.\n• Explain the topic aloud in simple words.`;
  } else if (selectedMode === 'practice') {
    body += `\n\nPRACTICE QUESTIONS\n1. Define the main concept in your own words.\n2. State two important facts or rules about it.\n3. Solve or explain a similar example.\n4. Give one real-life application.\n5. Explain how you would check your answer.\n\nTry the questions before asking for the answers.`;
  } else if (selectedMode === 'summary') {
    body = `📌 SUMMARY — ${lesson.title}\n\n${lesson.definition}\n\nKEY POINTS\n${lesson.concepts.slice(0,4).map(x=>'• '+x).join('\n')}\n\nMETHOD\n${lesson.steps.slice(0,4).map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nEXAMPLE\n${lesson.example}\n\n[DIAGRAM:${lesson.diagram}]\n\nKEY TAKEAWAY\n${lesson.check}`;
  } else if (selectedMode === 'lesson') {
    body += `\n\nTEACHING / CBE EXTENSION\n• Learning intention: Learners explain and apply the concept.\n• Suggested inquiry: What changes when one value or condition changes?\n• Learner activity: Work in pairs, explain the method, then compare solutions.\n• Assessment: Observe working, questioning, explanation and application.\n• Differentiation: Give guided examples to learners who need support and extension problems to fast learners.`;
  } else if (selectedMode === 'assessment') {
    body += `\n\nASSESSMENT IDEAS\n1. Recall: define the key concept.\n2. Application: solve a new example.\n3. Reasoning: explain why the method works.\n4. Transfer: apply the idea to a real-life situation.\n\nSimple 4-level rubric:\n4 — Accurate, clear and independently explained.\n3 — Mostly accurate with minor errors.\n2 — Partial understanding; needs guidance.\n1 — Beginning understanding; needs substantial support.`;
  } else if (selectedMode === 'inquiry') {
    body += `\n\nINQUIRY ACTIVITY\nAsk: What pattern or relationship can you discover?\nPredict: Learners make a prediction before calculating or observing.\nInvestigate: Test at least three examples.\nExplain: Describe the pattern using evidence.\nApply: Create a new example and solve it.`;
  } else if (selectedMode === 'remediation') {
    body += `\n\nREMEDIAL SUPPORT\n1. Revisit the key vocabulary.\n2. Use a simpler example with small numbers or familiar situations.\n3. Model one step at a time.\n4. Let the learner explain each step before moving on.\n5. Give two similar questions before increasing difficulty.`;
  }

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
