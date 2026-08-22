# Space Brokers pre-mint setup

The pre-mint classified landing page is now the default. The complete original site is still in the project and has not been deleted.

## Add the whitelist form

In Netlify, add the environment variable `NEXT_PUBLIC_WL_FORM_URL` with the public Google Form URL, then redeploy. Use the Google Forms embed URL where possible (`viewform?embedded=true`). The form opens inside the Space Brokers site and also offers an external-tab fallback.

Recommended form fields: X username, Discord username, EVM wallet address, and an agreement checkbox confirming the required follow/like/repost mission. Do not make the response spreadsheet public.

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
