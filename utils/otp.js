const crypto = require('crypto');

// In-memory store for OTPs. For production use a persistent store (Redis, DB).
const otpStore = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const generateOtpCode = (length = 6) => {
  const max = 10 ** length;
  const code = (Math.floor(Math.random() * (max - 1)) + 1).toString().padStart(length, '0');
  return code;
};

const sendViaTwilio = async (to, body) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    throw new Error('Twilio not configured');
  }

  const client = require('twilio')(sid, token);
  return client.messages.create({ body, from, to });
};

async function sendOtp(phoneNumber, opts = {}) {
  const code = generateOtpCode(opts.length || 6);
  const ttl = opts.ttl || DEFAULT_TTL;

  const expiresAt = Date.now() + ttl;

  otpStore.set(phoneNumber, { code, expiresAt });

  const message = opts.template
    ? opts.template.replace('{{code}}', code)
    : `Your verification code is ${code}. It expires in ${Math.round(ttl / 60000)} minutes.`;

  // Try to send via Twilio if configured, otherwise log
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      await sendViaTwilio(phoneNumber, message);
      return { success: true };
    }
  } catch (err) {
    // fallthrough to log mode
    console.error('Twilio send failed:', err.message);
  }

  // Fallback: log OTP to console (useful for development)
  console.info(`OTP for ${phoneNumber}: ${code}`);

  return { success: true, OTP: process.env.SEND_OTP_LOG === 'true' ? code : undefined };
}

function verifyOtp(phoneNumber, code) {
  const entry = otpStore.get(phoneNumber);
  if (!entry) return { success: false, message: 'No OTP found for this number' };

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phoneNumber);
    return { success: false, message: 'OTP expired' };
  }

  if (entry.code !== String(code).trim()) {
    return { success: false, message: 'Invalid OTP' };
  }

  otpStore.delete(phoneNumber);
  return { success: true };
}

module.exports = { sendOtp, verifyOtp };
