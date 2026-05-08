const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"Roomzy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Roomzy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to Roomzy!</h2>
        <p>Please verify your email address to complete your account registration.</p>
        <p style="margin: 20px 0;">
          <a href="${verificationUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy this link: ${verificationUrl}
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"Roomzy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Roomzy!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome, ${name}!</h2>
        <p>Your Roomzy account has been verified successfully.</p>
        <p>Start finding your perfect roommate today!</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #4f46e5;">Go to Dashboard</a>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Welcome email error:', error);
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"Roomzy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Roomzy password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Or copy this link: ${resetUrl}
        </p>
        <p style="color: #dc2626; font-size: 12px; margin-top: 20px;">
          ⚠️ This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Password reset email error:', error);
  }
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail };