# link-shortener

A minimal URL shortener built on Cloudflare Workers + KV. Worker reads the slug from path, finds the corresponding URL in KV, and issues a 302-redirect.

## Setup

Requires Node.js and a [Cloudflare account](https://dash.cloudflare.com/sign-up).

```bash
# 1. Install dependencies
npm install

# 2. Authenticate Wrangler with your Cloudflare account
npx wrangler login

# 3. Create a KV namespace, then copy the printed id into wrangler.jsonc,
#    replacing <YOUR_KV_NAMESPACE_ID>
npx wrangler kv namespace create LINKS

# 4. Deploy (serves from a free *.workers.dev subdomain)
npm run deploy
```

That's it — your shortener is live at `https://url-shortener.<your-subdomain>.workers.dev`.

### Optional: custom domain

To serve from your own hostname instead of `*.workers.dev`, uncomment the `routes`
block in `wrangler.jsonc`, set the `pattern` to your hostname, and redeploy. The
domain's zone must be on your Cloudflare account.

## Managing links

```bash
# Add / update a short link
npx wrangler kv key put --binding=LINKS "gh" "https://github.com/your-handle" --remote
# or more simply
yarn add-link gh https://github.com/your-handle

# Read one
npx wrangler kv key get --binding=LINKS "gh" --remote

# Delete one
npx wrangler kv key delete --binding=LINKS "gh" --remote

# List all slugs
npx wrangler kv key list --binding=LINKS --remote
```

Drop `--remote` to operate on the local dev namespace instead.

## Development

```bash
npm run dev        # local worker at http://localhost:8787
npm test           # run the Vitest suite
npm run typecheck  # tsc --noEmit
```

## License

[MIT](./LICENSE)
