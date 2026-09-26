# Production Launch Runbook

1. Confirm client/UAT sign-off and feature freeze.
2. Confirm production Atlas, Cloudinary, SMTP, domain, HTTPS and environment secrets.
3. Confirm backups and rollback route.
4. Configure Razorpay live credentials/webhook only at launch readiness.
5. Deploy backend and verify live/ready health endpoints.
6. Deploy frontend and verify API URL, HTTPS and SPA routing.
7. Run customer login/browse/cart/checkout smoke tests.
8. Run admin login/dashboard/order smoke tests.
9. Perform one small controlled live Razorpay payment and controlled refund if approved.
10. Verify order/payment/refund/email/webhook records.
11. Approve DNS/domain cutover and go-live.
12. Start first-day monitoring and keep rollback instructions available.
