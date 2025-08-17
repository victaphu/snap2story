This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Development Flags

- `MOCK_ANALYSIS=true`: Skips OpenAI image analysis and returns a canned response while echoing the uploaded image. Add to `.env.local` to test the Quick Create flow without consuming credits.
  - Used by `POST /api/analyze-hero`.
  - Example: `MOCK_ANALYSIS=true`

- `MOCK_PREVIEW=true`: Skips OpenAI image generation and uses the uploaded image as the generated cover. Lets you test the end‑to‑end funnel without any OpenAI calls.
  - Used by `POST /api/generate-preview`.
  - Example: `MOCK_PREVIEW=true`

## Story Templates from Supabase

Preview generation attempts to load story templates from Supabase first (table `story_templates` and RPC `get_story_pages_for_age`), falling back to local templates if unavailable. Ensure these env vars are set in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The route `POST /api/generate-preview` maps theme slugs to DB `story_id`s (e.g., `adventure` → `adventure_flexible_multiage`) and selects age-appropriate page text via the RPC.
