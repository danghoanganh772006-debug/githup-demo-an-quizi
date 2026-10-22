'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'quizdb',
  user: process.env.DB_USER || 'quiz_user',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function page(title, body) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#1768e8">
  <title>${esc(title)} - Quiz</title><style>
  :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b4d;background:#f3f7fc;font-synthesis:none}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;background:linear-gradient(180deg,#edf4ff 0,#f8faff 260px,#f4f7fb 100%)}
  a{color:inherit}.topbar{background:linear-gradient(100deg,#1768e8,#1557c0);color:white;box-shadow:0 3px 12px #174ea633}
  .nav{max-width:1040px;min-height:64px;padding:0 20px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}
  .brand{display:flex;align-items:center;gap:11px;font-weight:700;text-decoration:none}.brand-mark{width:31px;height:31px;display:grid;place-items:center;background:#ffffff24;border-radius:8px;font-size:19px}
  .nav-links{display:flex;gap:24px;font-size:14px}.nav-links a{text-decoration:none;color:#ffffffed}.nav-links a:hover{text-decoration:underline}
  .wrap{max-width:900px;margin:34px auto;padding:0 18px 42px}.page-heading{text-align:center;margin:0 0 22px;font-size:27px;letter-spacing:-.45px;color:#173b72}
  .card{background:#fff;border:1px solid #dce6f3;border-radius:12px;padding:22px;margin-bottom:15px;box-shadow:0 5px 18px #173b720d}
  h1,h2,h3,p{margin-top:0}h2{font-size:21px;margin-bottom:7px}h3{font-size:16px}.muted{color:#64748b;font-size:14px}
  .quiz-card{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:19px 20px}.quiz-card h2{font-size:17px;margin-bottom:6px}.quiz-card p{margin:0}
  .btn{background:#1768e8;color:white;border:0;border-radius:8px;padding:10px 17px;font-weight:650;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font:inherit;font-size:14px;white-space:nowrap}
  .btn:hover{background:#1055c4}.btn:focus-visible,input:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}.btn-secondary{background:#e8f0fc;color:#24518f}.btn-secondary:hover{background:#d8e6fb;color:#173b72}
  .student-form{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.student-form input{width:min(100%,280px)}
  input[type=text]{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;color:#172b4d;font:inherit}
  .student-name{display:grid;gap:7px;font-size:13px;color:#53647c}
  .quiz-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.tag{display:inline-flex;background:#e9f2ff;color:#1757a8;border-radius:99px;padding:5px 11px;font-size:12px;font-weight:650}
  .progress-copy{font-size:13px;font-weight:650;color:#385276;margin-bottom:8px}.progress-track{height:7px;background:#e3ebf6;border-radius:99px;overflow:hidden;margin-bottom:18px}
  .progress-fill{height:100%;width:0;background:#1768e8;border-radius:inherit;transition:width .2s ease}
  .question-panel{border:1px solid #dce6f3;border-radius:11px;padding:20px;margin:0 0 15px;min-height:180px}.question-panel h2{font-size:17px;line-height:1.5}
  .choice{display:flex;align-items:flex-start;gap:10px;padding:10px 11px;border:1px solid #e5ebf3;border-radius:8px;margin:9px 0;cursor:pointer;line-height:1.45}
  .choice:hover{border-color:#a9c8f6;background:#f7faff}.choice input{margin:3px 0 0;accent-color:#1768e8}.choice:has(input:checked){border-color:#7eabed;background:#f0f6ff}
  .quiz-actions{display:flex;justify-content:space-between;gap:12px}.form-error{color:#b42318;font-size:14px;margin:0 0 13px;min-height:1.2em}
  .result-banner{background:#e6f7f1;border:1px solid #bce8d8;border-radius:9px;padding:12px 15px;color:#08775e;margin-bottom:16px}
  .score{text-align:center;padding:26px 15px}.score h2{margin:0 0 8px}.score-value{font-size:38px;line-height:1.1;font-weight:750;color:#173b72;margin:7px 0}
  .answer-row{padding:13px 0;border-bottom:1px solid #e7edf5}.answer-row:last-child{border:0}.answer-row p{margin:5px 0;color:#53647c;font-size:14px}.correct{color:#08775e;font-weight:700}.incorrect{color:#b42318;font-weight:700}
  footer{color:#718096;font-size:13px;text-align:center;padding:18px 0 4px}
  @media(max-width:620px){.nav{min-height:58px;padding:0 14px}.nav-links{gap:14px;font-size:13px}.brand{font-size:14px}.wrap{margin:25px auto;padding:0 13px 28px}.page-heading{font-size:23px}.quiz-card{align-items:flex-start;flex-direction:column}.student-form{width:100%}.student-form input{flex:1}.quiz-heading{display:block}.quiz-heading .tag{margin-top:8px}.card{padding:17px}.quiz-actions .btn{padding:10px 12px}.question-panel{padding:15px}}
  </style></head><body><div class="topbar"><nav class="nav" aria-label="Điều hướng chính">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">▤</span><span>Hệ thống thi trắc nghiệm Quiz</span></a>
  <div class="nav-links"><a href="/">Trang chủ</a><a href="#footer">Hướng dẫn</a></div></nav></div>
  <main class="wrap">${body}<footer id="footer">Luyện tập, nộp bài và xem điểm tự động • Quiz DE35</footer></main></body></html>`;
}

function parseId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) ? id : null;
}

function studentName(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('health_check_error', error.message);
    res.status(503).json({ status: 'degraded', database: 'disconnected' });
  }
});

app.get('/', async (_req, res) => {
  try {
    const [sets] = await pool.query(
      'SELECT s.id, s.set_name, COUNT(q.id) AS question_count FROM quiz_sets s LEFT JOIN questions q ON q.set_id=s.id GROUP BY s.id, s.set_name ORDER BY s.id'
    );
    const cards = sets.length
      ? sets.map(set => `<article class="card quiz-card"><div><h2>${esc(set.set_name)}</h2>
          <p class="muted">Gồm ${set.question_count} câu hỏi trắc nghiệm</p></div>
          <form class="student-form" method="post" action="/quiz">
            <input type="hidden" name="set_id" value="${set.id}">
            <label class="student-name">Tên học viên
              <input name="student" type="text" maxlength="80" required placeholder="Nhập tên của bạn">
            </label>
            <button class="btn" type="submit">Làm bài <span aria-hidden="true">→</span></button>
          </form></article>`).join('')
      : '<section class="card"><p>Chưa có đề thi. Hãy thêm dữ liệu vào cơ sở dữ liệu để bắt đầu.</p></section>';
    res.send(page('Danh sách đề thi', `<h1 class="page-heading">Danh sách đề thi</h1>${cards}`));
  } catch (error) {
    console.error('home_page_error', error.message);
    res.status(503).send(page('Đang khởi tạo', '<section class="card"><h2>Hệ thống đang khởi tạo</h2><p>Hãy đợi MySQL sẵn sàng rồi tải lại trang.</p></section>'));
  }
});

async function renderQuiz(req, res) {
  const setId = parseId(req.body?.set_id || req.query.set);
  const student = studentName(req.body?.student || req.query.student);
  if (!setId || !student) return res.redirect('/');

  try {
    const [[set]] = await pool.query('SELECT id, set_name FROM quiz_sets WHERE id=?', [setId]);
    if (!set) return res.status(404).send(page('Không tìm thấy đề', '<section class="card">Không tìm thấy đề thi.</section>'));

    const [questions] = await pool.query(
      'SELECT id, question_text FROM questions WHERE set_id=? ORDER BY id',
      [setId]
    );
    if (!questions.length) {
      return res.status(400).send(page('Đề thi trống', '<section class="card">Đề thi này chưa có câu hỏi.</section>'));
    }
    const ids = questions.map(question => question.id);
    let choices = [];
    if (ids.length) {
      const [rows] = await pool.query(
        `SELECT id, question_id, choice_text FROM choices WHERE question_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`,
        ids
      );
      choices = rows;
    }

    const panels = questions.map((question, index) => `<section class="question-panel" data-question="${index}" ${index ? 'hidden' : ''}>
      <h2>Câu ${index + 1}. ${esc(question.question_text)}</h2>
      ${choices.filter(choice => choice.question_id === question.id).map((choice, choiceIndex) => `<label class="choice">
        <input type="radio" name="q_${question.id}" value="${choice.id}" ${choiceIndex === 0 ? 'required' : ''}>
        <span>${esc(choice.choice_text)}</span>
      </label>`).join('')}
    </section>`).join('');
    const body = `<section class="card">
      <div class="quiz-heading"><div><h1>${esc(set.set_name)}</h1><p class="muted">Học viên: <strong>${esc(student)}</strong></p></div><span class="tag">BÀI THI TRẮC NGHIỆM</span></div>
      <p class="progress-copy" id="progress-copy" aria-live="polite"></p>
      <div class="progress-track" role="progressbar" aria-label="Tiến độ làm bài" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="0"><div class="progress-fill" id="progress-fill"></div></div>
      <form id="quiz-form" method="post" action="/submit" novalidate>
        <input type="hidden" name="set_id" value="${set.id}">
        <input type="hidden" name="student" value="${esc(student)}">
        ${panels || '<p>Đề thi chưa có câu hỏi.</p>'}
        <p class="form-error" id="form-error" role="alert"></p>
        <div class="quiz-actions">
          <button class="btn btn-secondary" id="previous" type="button" hidden>← Trước</button>
          <span></span>
          <button class="btn" id="next" type="button" ${questions.length ? '' : 'disabled'}>Tiếp theo →</button>
          <button class="btn" id="submit" type="submit" hidden>Nộp bài</button>
        </div>
      </form>
    </section>
    <script>
    (()=>{const form=document.getElementById('quiz-form');const panels=[...document.querySelectorAll('[data-question]')];if(!form||!panels.length)return;
      const previous=document.getElementById('previous'),next=document.getElementById('next'),submit=document.getElementById('submit');
      const copy=document.getElementById('progress-copy'),fill=document.getElementById('progress-fill'),bar=fill.parentElement,error=document.getElementById('form-error');let current=0;
      function show(index){current=index;panels.forEach((panel,i)=>panel.hidden=i!==index);previous.hidden=index===0;next.hidden=index===panels.length-1;submit.hidden=index!==panels.length-1;
        copy.textContent='Câu '+(index+1)+' / '+panels.length;fill.style.width=((index+1)/panels.length*100)+'%';bar.setAttribute('aria-valuenow',String(index+1));error.textContent='';}
      function answered(index){return Boolean(panels[index].querySelector('input[type=radio]:checked'))}
      next.addEventListener('click',()=>{if(!answered(current)){error.textContent='Vui lòng chọn một đáp án để tiếp tục.';return}show(Math.min(current+1,panels.length-1))});
      previous.addEventListener('click',()=>show(Math.max(current-1,0)));
      form.addEventListener('submit',event=>{const missing=panels.findIndex((_,index)=>!answered(index));if(missing!==-1){event.preventDefault();show(missing);error.textContent='Vui lòng chọn đáp án cho câu hỏi này trước khi nộp bài.'}});
      show(0);
    })();
    </script>`;
    res.send(page(set.set_name, body));
  } catch (error) {
    console.error('quiz_page_error', error.message);
    res.status(500).send(page('Lỗi', '<section class="card">Không tải được đề thi. Vui lòng thử lại.</section>'));
  }
}

app.get('/quiz', renderQuiz);
app.post('/quiz', renderQuiz);

app.post('/submit', async (req, res) => {
  const setId = parseId(req.body?.set_id);
  const student = studentName(req.body?.student);
  if (!setId || !student) return res.redirect('/');

  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [[set]] = await connection.query('SELECT id, set_name FROM quiz_sets WHERE id=?', [setId]);
    if (!set) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).send(page('Không tìm thấy đề', '<section class="card">Không tìm thấy đề thi.</section>'));
    }
    const [questions] = await connection.query(
      'SELECT id, question_text, correct_choice_id FROM questions WHERE set_id=? ORDER BY id',
      [setId]
    );
    if (!questions.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).send(page('Đề thi trống', '<section class="card">Đề thi này chưa có câu hỏi.</section>'));
    }

    const [userResult] = await connection.query('INSERT INTO users (display_name) VALUES (?)', [student]);
    const [attemptResult] = await connection.query(
      'INSERT INTO attempts (user_id, set_id, total_questions, score, submitted_at) VALUES (?, ?, ?, 0, NOW())',
      [userResult.insertId, setId, questions.length]
    );
    let correct = 0;
    for (const question of questions) {
      const selectedId = parseId(req.body[`q_${question.id}`]);
      let selectedChoice = null;
      if (selectedId) {
        const [[choice]] = await connection.query(
          'SELECT id FROM choices WHERE id=? AND question_id=?',
          [selectedId, question.id]
        );
        selectedChoice = choice?.id ?? null;
      }
      const isCorrect = selectedChoice !== null && selectedChoice === question.correct_choice_id;
      if (isCorrect) correct++;
      await connection.query(
        'INSERT INTO attempt_answers (attempt_id, question_id, selected_choice_id, is_correct) VALUES (?, ?, ?, ?)',
        [attemptResult.insertId, question.id, selectedChoice, isCorrect ? 1 : 0]
      );
    }

    const score = Math.round((correct / questions.length) * 100);
    await connection.query('UPDATE attempts SET score=? WHERE id=?', [score, attemptResult.insertId]);
    const [answers] = await connection.query(
      `SELECT q.question_text, selected.choice_text AS selected_text, correct.choice_text AS correct_text, aa.is_correct
       FROM attempt_answers aa
       JOIN questions q ON q.id=aa.question_id
       LEFT JOIN choices selected ON selected.id=aa.selected_choice_id
       LEFT JOIN choices correct ON correct.id=q.correct_choice_id
       WHERE aa.attempt_id=? ORDER BY q.id`,
      [attemptResult.insertId]
    );
    await connection.commit();
    transactionStarted = false;
    console.log(`quiz_submission attempt_id=${attemptResult.insertId} set_id=${setId} score=${score}`);

    const details = answers.map((answer, index) => `<div class="answer-row">
      <strong>Câu ${index + 1}: ${answer.is_correct ? '<span class="correct">Đúng ✓</span>' : '<span class="incorrect">Sai ✕</span>'}</strong>
      <p>${esc(answer.question_text)}</p>
      <p>Đáp án của bạn: ${esc(answer.selected_text || 'Chưa chọn')}</p>
      ${answer.is_correct ? '' : `<p>Đáp án đúng: <strong>${esc(answer.correct_text || 'Chưa thiết lập')}</strong></p>`}
    </div>`).join('');
    const body = `<div class="result-banner" role="status">✓ &nbsp;Nộp bài thành công!</div>
      <section class="card score"><h2>Kết quả</h2><div class="score-value">${correct} / ${questions.length}</div>
      <p>Điểm số: <strong>${score}%</strong></p><a class="btn" href="/">Làm bài khác</a></section>
      <section class="card"><h2>Đáp án chi tiết</h2><p class="muted">${esc(set.set_name)} · Học viên: ${esc(student)}</p>${details}</section>`;
    res.send(page('Kết quả', body));
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('quiz_rollback_error', rollbackError.message);
      }
    }
    console.error('quiz_submission_error', error.message);
    res.status(500).send(page('Lỗi nộp bài', '<section class="card">Không lưu được bài làm. Hãy quay lại và thử lại.</section>'));
  } finally {
    if (connection) connection.release();
  }
});

app.get('/metrics', async (_req, res) => {
  try {
    const [[stats]] = await pool.query(
      'SELECT COUNT(*) AS attempts, COALESCE(AVG(score),0) AS avg_score FROM attempts'
    );
    res.type('text/plain').send(
      `# HELP quiz_attempts_total Total submitted quiz attempts\n# TYPE quiz_attempts_total gauge\nquiz_attempts_total ${stats.attempts}\n# HELP quiz_average_score Average quiz score\n# TYPE quiz_average_score gauge\nquiz_average_score ${Number(stats.avg_score).toFixed(2)}\n`
    );
  } catch (error) {
    console.error('metrics_error', error.message);
    res.status(503).type('text/plain').send('# database unavailable\n');
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`quiz_app_listening port=${PORT}`));
