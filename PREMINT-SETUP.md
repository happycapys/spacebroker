# Space Brokers pre-mint setup

The pre-mint classified landing page is now the default. The complete original site is still in the project and has not been deleted.

## Whitelist submissions

The whitelist application is a native Netlify Form named `space-brokers-wl`. It collects one EVM wallet address and a confirmation that the applicant followed the Space Brokers X account. No external form URL or environment variable is required.

After deployment, open the site in Netlify and select **Forms** to view or export submissions. The follow confirmation is self-reported; collecting only a wallet address cannot independently verify an X account.

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
