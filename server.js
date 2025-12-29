require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// Import user routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes); // <-- add here

// Contact form route
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message, website } = req.body || {};
    if (website) return res.status(400).json({ success: false, message: "Spam detected" });

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const to = (process.env.RECEIVER_LIST || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to,
      subject: `Contact form submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<div style="font-family:system-ui,Arial">
               <h3>New contact form submission</h3>
               <p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p style="white-space:pre-wrap;"><strong>Message:</strong><br/>${message}</p>
             </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response || info);
    return res.json({ success: true, message: "Message sent ✅" });
  } catch (err) {
    console.error("Send mail error:", err);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("SafeDrive Backend is running ✅");
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
