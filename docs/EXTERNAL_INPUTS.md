# Final External / User-Input Queue

These items cannot be truthfully completed from source code alone.

## Local runtime/browser
- Install dependencies and run full backend tests/frontend production build.
- Product-list/search load test against a running backend.
- Login load test using a disposable local/test account.
- Lighthouse and keyboard-only accessibility pass.
- Final customer/admin browser smoke tests.
- Actual Git repository/history secret scan.
- Dedicated `DB_URI_TEST` integration run.

## Razorpay
- Test Mode keys, test order/payment, invalid/fake payment checks, duplicate/retry behavior.
- Staging webhook URL + webhook secret, valid/invalid/deduplicated events.
- Paid-order refund and refund notification.
- Final API freeze rerun after Razorpay verification.
- Live keys/webhook, controlled real payment and controlled real refund near launch.

## Staging / production services
- Hosting URLs, domain/DNS and HTTPS.
- Staging/production Atlas, Cloudinary and SMTP credentials/access.
- Final frontend production domain (`CLIENT_URL`).
- Monitoring provider setup/alerts and production backup retention.
- Real backup restore rehearsal.

## Human/client dependent
- Staging UAT access, customer/admin/business-rule approval and client sign-off.
- Approved final changes/feature freeze/regression sign-off.
- Provider ownership transfer/source repository access.
- Go-live approval and post-launch monitoring/support completion.

Never paste passwords, JWT secrets, SMTP passwords, Razorpay secrets, Cloudinary API secret or DB connection passwords into chat. Configure them locally/at the hosting provider.
