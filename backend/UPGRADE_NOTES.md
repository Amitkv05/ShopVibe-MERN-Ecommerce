# Upgrade Notes

## Breaking/behavior changes

1. JWT is stored in an HTTP-only cookie and is not returned in the auth JSON body.
2. Frontend requests must use credentials (`withCredentials: true`).
3. `stock` is the canonical product field. Run `npm run migrate:stock` on an existing database that has `Stock`.
4. `POST /api/v1/new/order` requires `paymentMethod` (`COD` or `RAZORPAY`).
5. Order totals and item names/prices/images sent by the browser are ignored; they are rebuilt from Product records.
6. Razorpay orders should be created through `POST /api/v1/payment/order` and verified during final order creation.
7. Admin product/user/order list routes are paginated.
8. Empty product search results return HTTP 200 with `products: []`.

## Original secrets

The supplied source archive included an SMTP credential. It has been removed from this upgraded archive. Revoke it at the provider and create a new secret before running password-reset email in any environment.
