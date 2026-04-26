# Reecog Website

Static website deployed on Cloudflare Workers with a Worker handler for the contact form.

## Deploy to Cloudflare Workers

1. Create or open a Cloudflare Workers project and connect this GitHub repository.
2. Build settings:
   - Build command: `wrangler deploy`
3. Add environment variables in Workers > Settings > Variables:
   - RESEND_API_KEY
   - CONTACT_TO
   - CONTACT_FROM (optional, defaults to "Reecog <no-reply@reecog.com>")
4. Deploy. The contact endpoint will be available at `/api/contact`.

## Contact Form Worker

The Worker handler is in `src/worker.js` and accepts POST form data:
- name
- email
- companySize
- message

It sends email via Resend using the environment variables listed above.

## Local Notes

Use `wrangler dev` to test locally. Static assets are served via the `[assets]` config in `wrangler.toml`.
