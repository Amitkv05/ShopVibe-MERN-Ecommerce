# Start Here

Use this order when taking the release forward:

1. Local install/build/runtime verification.
2. Complete the items in `docs/EXTERNAL_INPUTS.md` that are needed for staging.
3. Deploy staging and run `npm run smoke:staging` plus the UAT checklist.
4. Complete Razorpay Test Mode, webhook and refund checks.
5. Re-run `npm run check:api-freeze` and freeze the final API contract.
6. Complete client UAT and approved fixes.
7. Configure production services, monitoring and backups.
8. Switch Razorpay to live only immediately before controlled launch.
9. Run the launch and post-launch runbooks.
