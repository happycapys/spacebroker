# Space Brokers pre-mint setup

The pre-mint classified landing page is now the default. The complete original site is still in the project and has not been deleted.

## Whitelist submissions

The whitelist application is a native Netlify Form named `space-brokers-wl`. It collects the applicant's X handle, one EVM wallet address, and confirmation that they followed the Space Brokers X account. No external form URL or environment variable is required.

After deployment, open the site in Netlify and select **Forms** to view or export submissions. Check each submitted X account follows `@spacebrokers_` before copying its associated wallet into the approved checker list.

Before testing, confirm form detection is enabled in Netlify and redeploy the site after enabling it. The application submits by AJAX to the dedicated static `/netlify-forms.html` blueprint required for Next.js sites. If a test does not appear under verified submissions, also check the form's spam submissions.

## Publish whitelist results

Replace `public/wl-wallets.json` with a JSON array of approved wallet addresses, then redeploy:

```json
[
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222"
]
```

The checker compares addresses without case sensitivity. Only publish approved wallet addresses—never X handles, Discord names, email addresses, or the private response sheet.

## Reveal the complete site after mint

Set `NEXT_PUBLIC_SITE_PHASE=postmint` in Netlify and redeploy. To return to the teaser, set it to `premint` or remove the variable.
