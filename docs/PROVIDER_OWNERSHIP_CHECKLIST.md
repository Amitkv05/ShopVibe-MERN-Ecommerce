# Provider Ownership / Access Checklist

Client-owned accounts should be preferred for production:
- Domain/DNS registrar
- Frontend hosting
- Backend hosting
- MongoDB Atlas
- Cloudinary
- SMTP/email provider
- Razorpay
- Monitoring/error tracking
- GitHub/source repository

For each provider record: account owner, billing owner, recovery email, MFA status, renewal date, minimum required developer access and removal date for temporary access. Do not place passwords/API secrets in this document.
