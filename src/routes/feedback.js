const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

router.post('/to-me', async (req, res) => {
  try {
    const feedbackMessage = escapeHtml(req.body.feedback_message);
    const rating = escapeHtml(String(req.body.rating));

    const output = `
      <p>You have a new Feedback for Timetable Companion</p>
      <h3>Feedback Details</h3>
      <ul>
        <li>Message: ${feedbackMessage} </li>
        <li>Rating: ${rating} </li>
        <li>Date: ${new Date().toLocaleString('en-IN')} </li>
      </ul>
    `;

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_MAIL,
        pass: process.env.SENDER_MAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: `Timetable Companion Server Admin <${process.env.SENDER_MAIL}>`,
      to:
        process.env.NODE_ENV === 'production'
          ? [process.env.DEV_RECEIVER_MAIL, process.env.PROD_RECEIVER_MAIL]
          : process.env.DEV_RECEIVER_MAIL,
      subject: 'New Feedback from Timetable Companion',
      html: output,
    };

    const response = await transporter.sendMail(mailOptions);

    // Save locally on the server
    const feedbackFilePath = path.join(__dirname, '../../feedback.txt');
    fs.appendFileSync(feedbackFilePath, output);

    const mailLogsArr = fs.existsSync(process.env.MAIL_LOG_FILE)
      ? JSON.parse(fs.readFileSync(process.env.MAIL_LOG_FILE).toString())
      : [];
    mailLogsArr.push(response);
    fs.writeFileSync(process.env.MAIL_LOG_FILE, JSON.stringify(mailLogsArr));

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to send feedback' });
  }
});

module.exports = router;
