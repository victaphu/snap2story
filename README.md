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

Preview generation loads story templates from Supabase first (table `story_templates` and RPC `get_story_pages_full_for_age`), falling back to local templates if unavailable. Templates support variants and tagging via these columns:

- `series_key`: groups variants of the same story concept
- `page_count`: number of pages for the variant (e.g., 10/20/30)
- `tags`: text[] for filtering in the UI (e.g., ['dreams','bedtime'])

Ensure these env vars are set in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The route `POST /api/generate-preview` maps the chosen theme/series to a concrete template and, when a length is selected, picks the sibling variant matching `page_count`. It selects age‑appropriate text via the `get_story_pages_full_for_age` RPC.

## Image Edit Endpoints

- `POST /api/image/stylize-openai`: Uses OpenAI `gpt-image-1` to edit an input image. Accepts `{ imageBase64, scene?, styleNotes?, keepLikeness?, maskBase64?, size?, bookId? }` and returns `{ image, promptUsed }`.
- `POST /api/image/qwen3imageedit`: Uses DashScope `qwen-image-edit`. Accepts `{ imageBase64, imageBase64_2?, scene?, styleNotes?, keepLikeness?, bookId? }`. Requires `QWEN_3_IMAGE_EDIT_KEY` in env. Returns `{ image, promptUsed }`.

## Image Provider Toggle

- `IMAGE_EDIT_PROVIDER`: Selects which provider the app uses for cover generation in `POST /api/generate-preview`.
  - Values: `qwen` (default) or `openai`.
  - When `qwen`, the route calls the internal `POST /api/image/qwen3imageedit`.
  - When `openai`, the route uses OpenAI `gpt-image-1` directly.
