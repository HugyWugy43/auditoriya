// Compatibility entry point. Use only against an isolated test deployment.
// TEST_BASE_URL is the gateway/site origin; TEST_SECRETS_FILE contains the test bootstrap configuration.
if (process.env.TEST_API_URL && !process.env.TEST_BASE_URL) process.env.TEST_BASE_URL = process.env.TEST_API_URL.replace(/\/api\/?$/, '')
await import('./hardening-api.mjs')
