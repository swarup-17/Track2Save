import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID) throw new Error('Missing TWILIO_ACCOUNT_SID');
if (!process.env.TWILIO_AUTH_TOKEN) throw new Error('Missing TWILIO_AUTH_TOKEN');
if (!process.env.TWILIO_VERIFY_SERVICE_SID) throw new Error('Missing TWILIO_VERIFY_SERVICE_SID');

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const verifyServiceSID = process.env.TWILIO_VERIFY_SERVICE_SID;