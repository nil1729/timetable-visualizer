const express = require("express");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const fs = require("fs");

router.post("/to-me", async (req, res) => {
  try {
    const output = `
            <p>You have a new Feedback for Timetable Companion</p>
            <h3>Feedback Details</h3>
            <ul>
                <li>Message: ${req.body.feedback_message} </li>
                <li>Rating: ${req.body.rating} </li>
                <li>Date: ${new Date().toLocaleString("en-IN")} </li>
            </ul>
        `;

    const msg = {
      to:
        process.env.NODE_ENV === "production"
          ? process.env.PROD_RECEIVER_MAIL
          : process.env.DEV_RECEIVER_MAIL,
      from: `Server Admin <${process.env.SENDGRID_SENDER_MAIL}>`,
      subject: "Feedback from Timetable Companion",
      html: output,
    };
    await sgMail.send(msg);

    // Save locally on Server
    fs.appendFileSync("feedback.txt", output);
    res.status(200).json({
      success: true,
      message: "Feedback sent successfully",
    });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
