OTP API

Endpoints:
- POST /api/auth/send-otp
  - Body: { "phoneNumber": "+911234567890" }
  - Sends a one-time code to the phone number. If Twilio is not configured it logs the code to console.

- POST /api/auth/verify-otp
  - Body: { "phoneNumber": "+911234567890", "code": "123456" }
  - Verifies the code and returns success

Environment variables (optional for Twilio):
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- SEND_OTP_LOG (set to 'true' to return OTP in response)

Notes:
- This implementation uses an in-memory store for OTPs (Map). For production use Redis or a database to persist OTPs with TTL.
- Typical registration flow: frontend calls `/send-otp` with the phone number, user enters received code, frontend calls `/verify-otp` to confirm, then calls `/register` with user details.

Testing locally:
- Start server: `npm run dev`
- Use Postman or curl to call `POST http://localhost:5000/api/auth/send-otp` with JSON body.
- If Twilio env vars are not set, check server logs for the printed OTP.
