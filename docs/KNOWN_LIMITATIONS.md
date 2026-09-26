# Known Limitations / Deferred Verification

- Razorpay Test Mode, webhook, paid refund and live-mode verification require real Razorpay account configuration.
- Final route/request/response API lock waits for Razorpay verification.
- Product/search performance numbers require a running local/staging backend with realistic data.
- Login load testing requires a disposable test account.
- Real MongoDB integration test requires a disposable `DB_URI_TEST` database.
- Final Cloudinary product-delete cleanup proof requires a real Cloudinary asset.
- Lighthouse and keyboard-only accessibility require a real built frontend in a browser.
- Admin media page has upload/delete but no backend-wide media-library listing endpoint; it shows assets uploaded in the current session.
- Git secret-history verification must run against the actual repository history.
- Staging, UAT, production infrastructure, DNS, monitoring, live payments and post-launch checks are environment/client dependent.
