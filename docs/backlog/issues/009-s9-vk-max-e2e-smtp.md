# S9 — VK/MAX adapters, E2E register→payment, SMTP

## Done when

- [x] VK Callback API adapter (save, connect, webhook, inbox reply)
- [x] MAX Bot API adapter (save, connect, webhook, inbox reply)
- [x] Integrations UI for VK and MAX
- [x] Playwright full flow register → e2e activate → dashboard
- [x] SMTP email via nodemailer (optional SMTP_HOST)
- [x] E2E_TEST_SECRET guarded `/billing/e2e/activate`

## Notes

- VK requires confirmation string from community Callback API settings
- MAX validates `X-Max-Bot-Api-Secret` header
- E2E accounts: `e2e-*@botme-test.local` only
