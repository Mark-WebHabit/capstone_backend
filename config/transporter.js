import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 587,
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

export const sendEmail = asyncHandler(async function (email, subject, text) {
  const html = `
    <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        text-align: center;
      }
      h1 {
        color: #333;
      }
      h5 {
        color: #777;
      }
      a {
        text-decoration: none;
        background-color: #007BFF;
        color: black;
        font-weight: 600;
        padding: 10px 20px;
        border: none;
        cursor: pointer;
      }
      a:hover {
        background-color: #0056b3;
        color: white;
      }
    </style>
  </head>
  <body>
    <h1>We notice you're trying to register in HOLY ANGELS MEMORIAL PARK</h1>
    <h5>To verify your account, click on the button below</h5>
    <a href="${text}">Verify</a>
  </body>
</html>

  `;

  transporter.sendMail({
    from: process.env.USER,
    to: email,
    subject: subject,
    html: html,
  });
});
export const validatePasswordRenewal = asyncHandler(async function (
  email,
  subject,
  text
) {
  const html = `
    <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        text-align: center;
      }
      h1 {
        color: #333;
      }
      h5 {
        color: #777;
      }
      a {
        text-decoration: none;
        background-color: #007BFF;
        color: black;
        font-weight: 600;
        padding: 10px 20px;
        border: none;
        cursor: pointer;
      }
      a:hover {
        background-color: #0056b3;
        color: white;
      }
    </style>
  </head>
  <body>
    <h1>We notice you're trying to renew your password in HOLY ANGELS MEMORIAL PARK</h1>
    <h5>To confirm your password renewal click the button below</h5>
    <a href="${text}">Change Password</a>
  </body>
</html>

  `;

  transporter.sendMail({
    from: process.env.USER,
    to: email,
    subject: subject,
    html: html,
  });
});
export const sendEmailViaContact = asyncHandler(async function (
  email,
  name,
  subject,
  message
) {
  const html = `
    <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
        text-align: center;
      }
      p{
        color:#000;
        font-size: 1rem;
      }
    </style>
  </head>
  <body>
    <p>${message}</p>
  </body>
</html>

  `;

  transporter.sendMail({
    from: email,
    to: process.env.USER,
    subject: `New Contact from ${name} || ${email}: ${subject}`,
    html: html,
  });
});
