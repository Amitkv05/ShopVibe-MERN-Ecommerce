# Security Policy

## Supported Version

This repository is maintained as a portfolio and engineering showcase. Security fixes are applied to the current `main` branch.

## Reporting a Security Issue

Do not publish credentials, tokens, payment secrets, private keys, customer data, or vulnerability details in a public GitHub issue.

If GitHub Private Vulnerability Reporting is enabled for this repository, use it to report security issues privately. Otherwise, contact the repository owner through a private channel before sharing technical details.

Do not include passwords, access tokens, refresh tokens, private keys, customer information, order details, or other sensitive information in public reports, screenshots, logs, or GitHub issues.

## Repository Security Rules

Never commit any of the following:

- Real `.env` files or production configuration values
- MongoDB credentials or private connection strings
- JWT secrets, access tokens, or refresh tokens
- SMTP usernames, passwords, or service credentials
- Cloudinary API secrets
- Razorpay secret keys or webhook secrets
- Production API keys
- Real customer, order, address, or account data
- Database dumps containing real data
- Private business documents or assets

Only sanitized `.env.example` templates and fictional/demo data should be committed.

## If a Secret Is Accidentally Committed

1. Rotate or revoke the exposed secret immediately.
2. Remove the secret from the current repository state.
3. Rewrite Git history if the repository was shared and the secret must be removed from previous commits.
4. Verify that the old credential no longer works.
5. Review provider logs and account activity where appropriate.
6. Check related environments, CI variables, and deployment settings for the same credential.

Removing a secret from the latest commit does not make an exposed credential safe; rotation or revocation is still required.

## E-Commerce Security Recommendations

- Keep pricing and order totals server-authoritative.
- Revalidate inventory and coupons at checkout.
- Protect checkout against duplicate requests with idempotency controls.
- Use database transactions where consistency requires them.
- Keep authentication cookies `HttpOnly` and configure `Secure` / `SameSite` appropriately in production.
- Restrict CORS to approved frontend origins.
- Use HTTPS for frontend-to-API traffic.
- Keep Razorpay, SMTP, Cloudinary, and database secrets on the backend only.
- Verify payment-provider webhooks server-side before trusting payment events.
- Apply authentication and authorization to admin and private customer endpoints.
- Rate-limit sensitive authentication and checkout endpoints.
- Validate and sanitize API input.
- Keep dependencies updated and review CI/security alerts before deployment.

## Data & Privacy

Use only fictional or sanitized data in screenshots, demo accounts, logs, test fixtures, backups, and documentation published with this repository.

Do not publish real names, email addresses, phone numbers, delivery addresses, payment information, order history, credentials, or other personal/customer data.

## Deployment Notes

The public ShopVibe deployment is a portfolio/demo environment. Live payment processing and other owner-managed production integrations should use separate credentials and production-grade operational controls.

Before deploying for a real business, review:

- Secret management
- Database access controls
- Backup retention
- Logging and monitoring
- Payment-provider configuration
- Domain and TLS configuration
- CORS policy
- Cookie policy
- Rate limits
- Admin access
- Data-retention and privacy requirements
