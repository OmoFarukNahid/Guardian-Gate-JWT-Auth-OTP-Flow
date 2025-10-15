const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

// Create transporter
const createTransporter = async () => {
  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;

    if (!accessToken) throw new Error('Failed to get access token');

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        accessToken: accessToken
      }
    });
  } catch (error) {
    console.error('❌ Transporter creation failed:', error.message);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `Your App <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
          <h2>Hello ${name}!</h2>
          <p>Your OTP code is:</p>
          <div style="background:#f4f4f4;padding:15px;text-align:center;margin:20px 0;">
            <h1 style="margin:0;font-size:32px;letter-spacing:5px;">${token}</h1>
          </div>
          <p>Expires in 2 minutes.</p>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}, Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    throw new Error(error.message);
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `Your App <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Our App!',
      html: `<h2>Welcome, ${name}!</h2><p>Your account has been verified successfully. Enjoy our app!</p>`
    };
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}, Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    throw new Error(error.message);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `Your App <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>Hello ${name},</p>
          <p>Your password reset OTP is:</p>
          <h1>${token}</h1>
          <p>Expires in 2 minutes.</p>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}, Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
