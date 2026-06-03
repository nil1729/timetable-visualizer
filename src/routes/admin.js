const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// In-memory config store (backed by file in production)
let appConfig = {
  mongodbUri: process.env.DB_URI || '',
  senderEmail: process.env.SENDER_MAIL || '',
  senderPassword: process.env.SENDER_MAIL_PASSWORD || '',
  devReceiverEmail: process.env.DEV_RECEIVER_MAIL || '',
  prodReceiverEmail: process.env.PROD_RECEIVER_MAIL || '',
  semesterStart: process.env.SEMESTER_START || '',
  semesterEnd: process.env.SEMESTER_END || '',
  pageLimit: process.env.PAGE_LIMIT || '10',
  pageStart: process.env.PAGE_START || '1',
  mailLogFile: process.env.MAIL_LOG_FILE || path.join(__dirname, '../../mail-log.json'),
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Load persisted config if it exists
const configPath = path.join(__dirname, '../../config/app-config.json');
if (fs.existsSync(configPath)) {
  try {
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    appConfig = { ...appConfig, ...saved };
  } catch (e) {
    console.error('Failed to load saved config:', e.message);
  }
}

/**
 * GET /admin/settings
 * Returns the admin settings page (HTML)
 */
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timetable Companion — Admin Settings</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 700px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 20px; }
    .card h2 { font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px; }
    .field input, .field select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .field input:focus, .field select:focus { outline: none; border-color: #4a90d9; box-shadow: 0 0 0 2px rgba(74,144,217,0.2); }
    .field .hint { font-size: 12px; color: #999; margin-top: 4px; }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn { padding: 10px 24px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #4a90d9; color: white; }
    .btn-primary:hover { background: #357abd; }
    .btn-secondary { background: #eee; color: #555; }
    .btn-secondary:hover { background: #ddd; }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 24px; border-radius: 6px; color: white; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all 0.3s; }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.success { background: #27ae60; }
    .toast.error { background: #e74c3c; }
    .setup-banner { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; font-size: 14px; }
    .setup-banner strong { color: #856404; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .status-dot.connected { background: #27ae60; }
    .status-dot.missing { background: #e74c3c; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timetable Companion</h1>
    <p class="subtitle">Admin Settings — Configure everything from your browser</p>

    <div class="setup-banner" id="setupBanner" style="display:none">
      <strong>Setup required:</strong> Configure the settings below and click "Test & Save" to get started.
    </div>

    <div class="card">
      <h2>Database</h2>
      <div class="field">
        <label for="mongodbUri">MongoDB Connection URI</label>
        <input type="text" id="mongodbUri" placeholder="mongodb://localhost:27017/timetable" value="${escapeAttr(appConfig.mongodbUri)}">
        <div class="hint">e.g., mongodb://localhost:27017/timetable or a MongoDB Atlas URL</div>
      </div>
      <div style="font-size:13px;">
        <span class="status-dot ${appConfig.mongodbUri ? 'connected' : 'missing'}"></span>
        ${appConfig.mongodbUri ? 'Configured' : 'Not configured'}
      </div>
    </div>

    <div class="card">
      <h2>Email (Gmail SMTP)</h2>
      <div class="field">
        <label for="senderEmail">Sender Email Address</label>
        <input type="email" id="senderEmail" placeholder="you@gmail.com" value="${escapeAttr(appConfig.senderEmail)}">
        <div class="hint">Must be a Gmail address with "App Password" enabled</div>
      </div>
      <div class="field">
        <label for="senderPassword">Gmail App Password</label>
        <input type="password" id="senderPassword" placeholder="16-character app password" value="${escapeAttr(appConfig.senderPassword)}">
        <div class="hint">Generate at https://myaccount.google.com/apppasswords</div>
      </div>
      <div class="field">
        <label for="devReceiverEmail">Receiver Email (Development)</label>
        <input type="email" id="devReceiverEmail" placeholder="admin@example.com" value="${escapeAttr(appConfig.devReceiverEmail)}">
      </div>
      <div class="field">
        <label for="prodReceiverEmail">Receiver Email (Production)</label>
        <input type="email" id="prodReceiverEmail" placeholder="admin@example.com" value="${escapeAttr(appConfig.prodReceiverEmail)}">
      </div>
    </div>

    <div class="card">
      <h2>Semester Configuration</h2>
      <div class="field">
        <label for="semesterStart">Semester Start Date</label>
        <input type="date" id="semesterStart" value="${appConfig.semesterStart}">
        <div class="hint">Used for ICS calendar generation (first day of classes)</div>
      </div>
      <div class="field">
        <label for="semesterEnd">Semester End Date</label>
        <input type="date" id="semesterEnd" value="${appConfig.semesterEnd}">
        <div class="hint">Last day of the semester</div>
      </div>
    </div>

    <div class="card">
      <h2>Application</h2>
      <div class="field">
        <label for="pageLimit">Courses Per Page</label>
        <input type="number" id="pageLimit" min="1" max="50" value="${escapeAttr(appConfig.pageLimit)}">
      </div>
      <div class="field">
        <label for="nodeEnv">Environment</label>
        <select id="nodeEnv">
          <option value="development" ${appConfig.nodeEnv === 'development' ? 'selected' : ''}>Development</option>
          <option value="production" ${appConfig.nodeEnv === 'production' ? 'selected' : ''}>Production</option>
        </select>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="saveConfig()">Save Configuration</button>
      <button class="btn btn-secondary" onclick="testConfig()">Test Connection</button>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    async function saveConfig() {
      const data = {
        mongodbUri: document.getElementById('mongodbUri').value,
        senderEmail: document.getElementById('senderEmail').value,
        senderPassword: document.getElementById('senderPassword').value,
        devReceiverEmail: document.getElementById('devReceiverEmail').value,
        prodReceiverEmail: document.getElementById('prodReceiverEmail').value,
        semesterStart: document.getElementById('semesterStart').value,
        semesterEnd: document.getElementById('semesterEnd').value,
        pageLimit: document.getElementById('pageLimit').value,
        nodeEnv: document.getElementById('nodeEnv').value,
      };

      try {
        const res = await fetch('/api/v1/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          showToast('Settings saved! Restart the server to apply.', 'success');
        } else {
          showToast(result.error || 'Failed to save settings', 'error');
        }
      } catch (e) {
        showToast('Network error — is the server running?', 'error');
      }
    }

    async function testConfig() {
      await saveConfig();
      try {
        const res = await fetch('/api/v1/admin/test');
        const result = await res.json();
        if (result.success) {
          showToast('All checks passed! Database connected.', 'success');
        } else {
          showToast('Test failed: ' + (result.error || 'Unknown error'), 'error');
        }
      } catch (e) {
        showToast('Test failed — cannot reach the server', 'error');
      }
    }

    function showToast(msg, type) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show ' + type;
      setTimeout(() => { t.className = 'toast'; }, 4000);
    }

    // Show setup banner if no config
    if (!document.getElementById('mongodbUri').value || !document.getElementById('senderEmail').value) {
      document.getElementById('setupBanner').style.display = 'block';
    }

    function escapeAttr(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  </script>
</body>
</html>
  `);
});

/**
 * POST /api/v1/admin/settings
 * Save configuration
 */
router.post('/settings', (req, res) => {
  try {
    const newConfig = { ...appConfig, ...req.body };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    appConfig = newConfig;

    // Update process.env for current session
    Object.keys(newConfig).forEach((key) => {
      const envMap = {
        mongodbUri: 'DB_URI',
        senderEmail: 'SENDER_MAIL',
        senderPassword: 'SENDER_MAIL_PASSWORD',
        devReceiverEmail: 'DEV_RECEIVER_MAIL',
        prodReceiverEmail: 'PROD_RECEIVER_MAIL',
        semesterStart: 'SEMESTER_START',
        semesterEnd: 'SEMESTER_END',
        pageLimit: 'PAGE_LIMIT',
        pageStart: 'PAGE_START',
        nodeEnv: 'NODE_ENV',
      };
      const envKey = envMap[key];
      if (envKey && newConfig[key]) {
        process.env[envKey] = String(newConfig[key]);
      }
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Failed to save config:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/v1/admin/test
 * Test database connectivity
 */
router.get('/test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const testConn = await mongoose.createConnection(appConfig.mongodbUri).asPromise();
    await testConn.close();
    res.json({ success: true, message: 'Database connection successful' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/v1/admin/config
 * Returns current config (without passwords)
 */
router.get('/config', (req, res) => {
  const safe = { ...appConfig };
  delete safe.senderPassword;
  res.json(safe);
});

module.exports = router;
