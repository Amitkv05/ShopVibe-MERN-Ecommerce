# API Freeze / Change Control

This backend keeps the production API baseline under an explicit freeze gate.

## What is frozen

- Public HTTP method + route paths in `docs/api-contract.json`.
- Request-contract surface (route wiring, validators and controller request handling).
- Response-contract surface (controllers, health/system responses and global error responses).
- OpenAPI method/path surface.
- App/API version alignment.

The exact baseline fingerprints are stored in `docs/api-freeze-manifest.json`.

## Verify the baseline

```bash
npm run check:api-freeze
```

The command fails when executable routes no longer match the contract, OpenAPI drifts from the contract, version metadata disagrees, or a frozen request/response surface changes.

## Intentional API changes

Do not edit the freeze manifest by hand to silence a failure. Review the API change first. For an approved change, update the contract/OpenAPI/version as needed, increment `API_CONTRACT_REVISION` in `config/version.js`, and deliberately create the matching next baseline revision:

```bash
npm run api:freeze:update -- --revision 2 --reason "Describe the approved API contract change"
npm run check:api-freeze
```

The revision must increase and a meaningful reason is mandatory. Breaking public API changes should also bump `API_VERSION`; release-level changes should keep `package.json`, `APP_VERSION`, and OpenAPI `info.version` aligned.

## Release note

The code-level API baseline can be prepared before external gateway setup, but the final production API lock is not considered complete until the deferred Razorpay Test Mode/webhook/refund verification has passed and the freeze check is run again afterward.
