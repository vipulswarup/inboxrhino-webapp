# Developer distribution checklist

The website already publishes `public/openapi.yaml` and `public/postman/InboxRhino.postman_collection.json`. These files are crawlable but carry `X-Robots-Tag: noindex, follow`; the HTML API documentation is their indexable landing page.

## Public Postman workspace

1. Import `postman/InboxRhino.postman_collection.json` into a workspace owned by the InboxRhino organization.
2. Keep `apiKey` as an empty collection variable. Never publish a live key or environment export containing one.
3. Set the workspace and collection descriptions to link to:
   - Website: `https://inboxrhino.in`
   - API reference: `https://inboxrhino.in/docs/api`
   - OpenAPI: `https://inboxrhino.in/openapi.yaml`
   - Playwright guide: `https://inboxrhino.in/docs/playwright`
4. Verify the create, wait, inspect, attachment and delete requests against production with a disposable inbox.
5. Add the public workspace URL to the docs only after publication. Record the owner and review cadence.

## TypeScript distribution

Start with the standalone `examples/playwright-signup` project. It uses the REST contract directly, so it does not create an SDK API that must be maintained before the service contract stabilizes.

Before publishing an SDK, assign an owner and define its support policy, versioning, runtime support, timeout and retry behavior, error types, abort handling and contract-test source. Package metadata must link to the real public repository, documentation and issue tracker. Do not publish placeholder package names or repository URLs.
