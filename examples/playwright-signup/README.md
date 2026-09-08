# InboxRhino Playwright signup example

This standalone example creates a unique real-MX InboxRhino address, submits it to an application signup form, waits for one matching verification message, follows the verification link, and deletes the inbox in `finally`.

It accompanies the maintained guide at <https://inboxrhino.in/docs/playwright> and the API reference at <https://inboxrhino.in/docs/api>.

## Run it

```bash
npm install
npx playwright install chromium
INBOXRHINO_API_KEY=ir_live_... \
SIGNUP_URL=https://staging.example.com/signup \
EXPECTED_SENDER=noreply@example.com \
EXPECTED_SUBJECT=Verify \
npm test
```

Adapt the form labels, submit-button name and success assertion in `tests/signup-email.spec.ts` to the application under test. Keep secrets in local environment variables or CI secret storage.

The wait endpoint returns HTTP 204 with an empty body when no matching message arrives in 180 seconds. The test reports that state separately and always attempts inbox cleanup, which releases the active-inbox slot but does not restore monthly email quota.

## Publishing checklist

- Move this directory into a dedicated public repository owned by the InboxRhino maintainer.
- Add the final repository URL to `package.json` and the website Playwright guide.
- Run the example against a maintained synthetic signup application in CI.
- Enable dependency updates and assign a named maintenance owner.
- Tag releases only after the example and documented API contract agree.
