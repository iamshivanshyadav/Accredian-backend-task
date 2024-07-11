const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/referral', async (req, res) => {
  const { name, email, referred,referredName, message } = req.body;

  if (!name || !email || !referred) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate 'referred' as an email address
    if (!isValidEmail(referred)) {
      console.log(referred)
    return res.status(400).json({ error: 'Invalid email address for referred' });
  }

  try {
    const newReferral = await prisma.referral.create({
      data: {
        name,
           email,
        referredName,
        referred,
        message,
      },
    });

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: referred, // Ensure 'referred' is a valid email address
      subject: 'You have been referred!',
      text: `Hello ${referredName}, ${name} has referred you. Under program ${message || 'No message provided.'}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }
      res.status(201).json(newReferral);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save referral' });
  }
});

// Helper function to validate email format
function isValidEmail(email) {
  // Use regex or a more sophisticated email validation library if needed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
