
# StoryMosaic – Screen-by-Screen UX Specification (Desktop & Mobile)

**Version:** 1.0  
**Owner:** Product/PM  
**Date:** July 2025

This document defines every screen for **StoryMosaic**, with explicit behavior on **desktop (header + left sidebar)** and **mobile (bottom navigation)**. Each screen lists layout, controls, navigation, data/API hooks, analytics, and edge cases. The goal is to eliminate ambiguity for implementation.

---

## Global UX & Layout Conventions

### Breakpoints
- **Mobile:** ≤ 640px
- **Tablet:** 641–1024px
- **Desktop:** ≥ 1025px

### Desktop Chrome
- **Header (persistent):** Left-aligned logo + app name; center search (where applicable); right: notifications bell, help, user avatar menu (Clerk).
- **Left Sidebar (persistent):** Large icons + labels. Items (top → bottom):
  1. Home
  2. Create (New Story)
  3. My Stories
  4. Orders
  5. Help / Support
  6. Account
- **Content Area:** Card-based, max content width 1200px.

### Mobile Chrome
- **Top Bar (contextual):** Screen title + optional actions (back, close).
- **Bottom Nav (persistent):** 5 items with icons + labels:
  - Home, Create, Library, Orders, Account
- **Floating Action Button (contextual):** “Create” on Home and Library.

### Visual System
- **Colors:** Pastel cream background, lavender/purple primary, soft blue accents, coral CTA highlights.
- **Typography:** Large, high-contrast, 16–20px body, 24–32px titles.
- **Touch targets:** ≥ 48×48 px.
- **Accessibility:** WCAG AA contrast; keyboard focus outlines; ARIA for interactive elements; live-region loading states.

### Common Components
- **Primary Button:** Filled, rounded, large.
- **Secondary Button:** Outline, rounded.
- **Card:** Soft shadow, large padding, rounded corners.
- **Progress Ring:** Animated, supports numeric page count inside.
- **Toast:** Top-right (desktop) / top (mobile).

---

## 1) Welcome / Home

**Purpose:** Entry point with four primary actions.

### Desktop
- **Header:** Logo + “StoryMosaic”; search (disabled on this screen), notifications, help, avatar (Clerk).
- **Left Sidebar:** Highlights **Home**.
- **Content:** 2×2 grid of large cards:
  - Create a New Story
  - View My Stories
  - Help / Support
  - Account

### Mobile
- **Top Bar:** “Home”
- **Bottom Nav:** Home active.
- **Content:** Same four options in a 2×2 grid; large tap targets; FAB “Create”.

**Controls & Actions**
- Clicking a card:
  - **Create a New Story →** `/create/upload-heroes`
  - **View My Stories →** `/library`
  - **Help / Support →** `/help`
  - **Account →** `/account`

**Data/API:** None.

**Analytics:** `home_viewed`, clicks per card.

**Edge Cases:** If not authenticated, Clerk modal prompts login before proceeding.

---

## 2) Upload Heroes (Photos)

**Purpose:** Upload 1–3 reference images.

### Desktop
- **Header + Sidebar:** Present; **Create** highlighted.
- **Content:** Large drop zone with camera icon and text: “Upload the heroes of the story” + hint below.
- **Buttons:** Skip, Next (Next disabled until ≥1 image).

### Mobile
- **Top Bar:** “Upload photos”
- **Bottom Nav:** Create active.
- **Content:** Single-column drop zone; “Skip” text button; “Next” primary button.

**Actions**
- Drag & drop or click to upload (PNG/JPG; ≤ 10MB each; up to 3).
- Next → `/create/choose-theme`
- Skip → `/create/choose-theme` (flag `imagesProvided=false`).

**Data/API**
- Upload to **Supabase Storage** (`/heroes/{userId}/{storyId}/{filename}`).
- Persist `storyId` draft in Supabase `stories` (state = `draft`).

**Analytics:** `upload_viewed`, `photo_uploaded`, `skip_upload`.

**Edge Cases:** Invalid type/oversize → inline error; network fail → retry toast.

---

## 3) Choose a Theme

**Purpose:** Select starting template.

### Desktop
- **Sidebar:** Create active.
- **Content:** 2×3 grid of big tiles: Bedtime, Family Adventures, Celebrations, Travel, Visiting Places, Customize Your Own.

### Mobile
- **Top Bar:** “Choose a theme”
- **Bottom Nav:** Create active.
- **Content:** 2×3 grid; scrollable.

**Actions**
- Click a tile:
  - If **Customize Your Own →** `/create/custom/editor`
  - Else → `/create/theme/{slug}` (submenu).

**Data:** Persist theme to `stories.theme`.

**Analytics:** `theme_opened`, `theme_selected`.

**Edge Cases:** None.

---

## 4) Theme Submenus (per category)

**Purpose:** Narrow down preset path.

### Desktop
- **Content:** 2×2 grid (e.g., Celebrations → Birthday, Holiday, Summer Picnic, Reunion).

### Mobile
- **Top Bar:** “{Theme} options”

**Actions**
- Select option → `/create/describe` for custom prompt OR direct `/create/processing?preset={option}` (if no extra input needed).

**Data:** Save `stories.subtheme`.

**Analytics:** `subtheme_selected`.

**Edge Cases:** None.

---

## 5) Describe Your Story (Text or Voice)

**Purpose:** Capture story prompt.

### Desktop
- **Content:** Left column: instructions; center: large textarea (300–500 chars). Right: tips panel.
- **Controls:** 🎤 Speak (Web Speech API), Next (disabled until non-empty).

### Mobile
- **Top Bar:** “Describe your story”
- **Content:** Textarea + Speak; Next button fixed bottom.

**Actions**
- Next → POST to OpenAI (prompt + optional extracted traits from images) → `/create/processing`

**Data/API**
- Save `stories.custom_prompt` in Supabase.
- Netlify Function: `POST /api/story/generate` calls **OpenAI GPT** (story outline + per-page captions).

**Analytics:** `describe_opened`, `voice_used`, `prompt_submitted`.

**Edge Cases:** Mic permission denied → fallback to text; empty text → blocked.

---

## 6) Processing (40 pages)

**Purpose:** Generate 40 pages (text left, image right).

### Desktop
- **Content:** Centered progress ring with numeric `X/40`. Text: “Creating your 40 pages…” Estimated time under (e.g., “~1–2 min”).

### Mobile
- **Content:** Same elements stacked; big font.

**Actions**
- Auto progression; cancel button (returns to Describe with “Resume generation?” on re-entry).

**Data/API**
- Netlify **Background Function** orchestrates:
  - **OpenAI Chat**: finalize page texts
  - **DALL·E**: generate 40 images
- Save to Supabase `story_pages` and Storage.
- Emit real-time status via Supabase Realtime (optional).

**Analytics:** `generation_started`, `page_generated`, `generation_completed`.

**Edge Cases:** API timeouts → exponential backoff; partial completion → resume queue.

---

## 7) Book Ready (Purchase Options)

**Purpose:** Present actions post-generation.

### Desktop
- **Content:** Title “Your picture book is ready!”
- **Grid (2×2):**
  - Preview the Book
  - Download Soft Copy ($5)
  - Print Softcover ($25)
  - Print Hardcover ($50)
- “Retry” link (shows remaining retries, max 3).

### Mobile
- **Top Bar:** “Ready!”
- **Content:** Same 2×2 grid; bottom explanatory text about delivery times.

**Actions**
- Preview → `/book/{storyId}/viewer`
- Download → Stripe Checkout (product: `pdf_download`) → on success, create signed URL for PDF.
- Softcover/Hardcover → Stripe Product → on success, trigger Lulu order.

**Data/API**
- Stripe Checkout + Webhooks → Netlify Function updates `orders` table.
- Lulu xPress API: job creation using story PDF (see PDF generation below).

**Analytics:** `ready_viewed`, `purchase_selected`, `retry_selected`.

**Edge Cases:** Payment fail → show retry; PDF not yet compiled → show spinner with ETA.

---

## 8) Digital Book Viewer

**Purpose:** Flip-through reading preview.

### Desktop
- **Layout:** Left/right page view with page controls; right column CTA to purchase; top search within story (optional).
- **Controls:** Next/prev arrows, page thumbnails strip, zoom.

### Mobile
- **Content:** Single-page view; swipe to flip; sticky purchase CTA.

**Actions**
- Purchase → opens pricing modal (same options).

**Data:** Loads from `story_pages`.

**Analytics:** `viewer_opened`, `page_viewed`, `purchase_from_viewer`.

**Edge Cases:** Large images → lazy load; offline → show cached pages (PWA).

---

## 9) My Stories (Library)

**Purpose:** Manage created stories.

### Desktop
- **Content:** Grid/list toggle; filters: theme, date, status (draft/ready/ordered). Row actions: View, Edit, Order, Delete.

### Mobile
- **Content:** 2-column grid, minimal metadata; long-press actions or overflow menu.

**Actions**
- View → Viewer
- Edit → Edit Mode (if AI) or Custom Editor
- Order → Pricing modal

**Data:** `stories` query by `user_id`.

**Analytics:** `library_viewed`, `library_action_clicked`.

**Edge Cases:** Empty state with CTA “Create a New Story”.

---

## 10) Edit Mode (Auto-Generated)

**Purpose:** Let users tweak AI-generated pages.

### Desktop
- **Layout:** Page canvas center. Right panel: caption editor; image tools (Replace/Regenerate). Bulk reorder disabled.
- **Controls:** Save, Cancel, Convert to Custom (top-right).

### Mobile
- **Content:** Page view; tabs for Text / Image; “Save” sticky button.

**Actions**
- Replace Image → Upload or Regenerate (OpenAI) for that page.
- Convert to Custom → selects up to 10 pages to port into Custom Editor.

**Data:** `story_edits` table tracks overrides; audit history optional.

**Analytics:** `edit_opened`, `caption_saved`, `image_regenerated`, `convert_to_custom`.

**Edge Cases:** Retry quota exceeded → block regenerate with tooltip.

---

## 11) Custom Adventure Editor (Up to 10 Pages)

**Purpose:** Full manual creation workflow.

### Desktop
- **Layout:** Left: page list with drag-and-drop; Middle: page canvas; Right: properties (text, image prompt, upload).
- **Controls:** Add Page (max 10), Delete, Reorder, Generate Image, Upload Image, Save Draft, Preview.

### Mobile
- **Content:** Stepper for pages (1–10); per page: text area + image section; reorder via up/down controls; toolbar sheet for add/delete.

**Actions**
- Generate → calls OpenAI Image (stores to Storage).
- Preview → opens mini-viewer of 10 pages.
- Finish → routes to Ready (pricing shows PDF only by default unless print option allowed for 10 pages).

**Data:** `custom_stories`, `custom_pages`.

**Analytics:** `custom_opened`, `page_added`, `page_reordered`, `image_generated`.

**Edge Cases:** Page limit reached → disable Add; unsaved changes guard on navigate away.

---

## 12) Checkout

**Purpose:** Complete payment.

### Desktop
- **Layout:** Summary card (product, price, taxes/shipping); shipping form for prints; Stripe Checkout or embedded Elements; order terms checkbox.

### Mobile
- **Content:** Single-column scroll; Apple Pay/Google Pay prominent where supported.

**Actions**
- Pay → Stripe; on success → `/thank-you?orderId=...`

**Data/API:** Stripe session created via Netlify Function; webhook updates `orders` table; generates download link or triggers Lulu.

**Analytics:** `checkout_started`, `payment_succeeded`, `payment_failed`.

**Edge Cases:** Address validation fail; card declines; retry flow.

---

## 13) Thank You

**Purpose:** Confirm completion and provide actions.

### Desktop & Mobile
- **Content:** “Thank you!” + puppy bowing image; buttons:
  - Download PDF
  - Share (Web Share API / copy link)
  - View Order
  - Create Another
- **Note:** Shows retry credits remaining.

**Data:** Secure signed URL for download; order status reference.

**Analytics:** `thank_you_viewed`, `download_clicked`, `share_clicked`.

**Edge Cases:** Signed URL expired → regenerate link endpoint.

---

## 14) Account & Settings

**Purpose:** Manage profile, payment prefs, accessibility.

### Desktop
- **Layout:** Tabs or cards:
  - My Account (name, email, password via Clerk)
  - Payment Methods
  - Accessibility (font size, voice tips)
  - Notifications (email opt-in)
  - Addresses (for prints)
  - Logout

### Mobile
- **Content:** Stacked list; bottom nav Account active.

**Data:** Clerk for auth; Supabase for profile/preferences.

**Analytics:** `account_viewed`, `pref_changed`.

**Edge Cases:** Email already used → display Clerk error.

---

## 15) Help / Support

**Purpose:** Self-serve help + live chat.

### Desktop & Mobile
- **Content:** FAQ accordion; quick links; “Contact support” button (Intercom/Crisp).

**Data:** HubSpot ticket creation for complaints; Intercom chat transcript stored to HubSpot via integration.

**Analytics:** `help_viewed`, `chat_opened`, `ticket_created`.

---

## 16) Orders

**Purpose:** Track purchases and print jobs.

### Desktop
- **Content:** Table with orderId, story title, type (PDF/Soft/Hard), status (paid, in production, shipped), actions (view invoice, download).

### Mobile
- **Content:** Cards with condensed info; expand for details.

**Data:** `orders` table; Lulu webhook to update print status.

**Analytics:** `orders_viewed`.

---

## 17) Notifications & System States

- Toasts for events (uploaded, saved, failed).
- Inline errors under fields.
- Skeleton loaders for content areas.
- PWA offline banners; offline viewer for cached books (optional).

---

# Data Model (Supabase)

**stories**: id, user_id, theme, subtheme, custom_prompt, status (draft/generating/ready), created_at, retry_count  
**story_pages**: id, story_id, page_num, text, image_url, edited_text, edited_image_url  
**custom_stories**: id, user_id, title, created_at, updated_at  
**custom_pages**: id, story_id, page_num, text, image_url, prompt  
**orders**: id, user_id, story_id, product_type (pdf/soft/hard), stripe_session_id, status, lulu_order_id  
**users**: id, clerk_id, email, created_at

RLS: users can only access rows where `user_id = auth.uid()`.

---

# Integrations & Endpoints

- **Auth:** Clerk (JWT)  
- **Storage:** Supabase Storage buckets: `heroes/`, `pages/`, `exports/`  
- **AI Text:** `POST /api/story/generate` → OpenAI Chat (outline + page texts)  
- **AI Image:** `POST /api/image/generate` → DALL·E for individual page image  
- **Progress:** `GET /api/story/status?storyId` (poll or realtime)  
- **Export PDF:** `POST /api/export/pdf` Netlify Background Fn → compiles PDF (Puppeteer)  
- **Stripe:** `POST /api/checkout/session` + `/api/stripe/webhook`  
- **Lulu:** `POST /api/print/order` (create job) + webhook `/api/print/webhook`  
- **HubSpot:** `POST /api/hubspot/contact` (sync on signup) + `POST /api/hubspot/event` (story created)  
- **Stores:** `/api/shopify/webhook`, `/api/etsy/webhook` (future)

---

# Instrumentation (PostHog)

Track events & properties:
- `home_viewed`
- `upload_viewed`, `photo_uploaded`
- `theme_selected`, `subtheme_selected`
- `prompt_submitted`
- `generation_started`, `page_generated`, `generation_completed`
- `ready_viewed`, `purchase_selected`
- `viewer_opened`, `page_viewed`
- `edit_opened`, `image_regenerated`, `convert_to_custom`
- `custom_opened`, `page_added`, `page_reordered`
- `checkout_started`, `payment_succeeded`, `payment_failed`
- `download_clicked`, `share_clicked`
- `help_viewed`, `chat_opened`, `ticket_created`

---

# Error/Edge Handling

- Network: show retry with exponential backoff.  
- API quota: friendly message + option to “Try later”.  
- Stripe decline: reason + change method prompt.  
- Print failure: auto-retry (3x) then support ticket suggestion.  
- Unsaved changes: confirm on nav away.  
- Retry credits: prevent generation if `retry_count >= 3` with explainer.

---

# PWA & Performance

- Install prompt on eligible devices.  
- Cache shell + critical assets; optional page image caching for viewer.  
- Preload next page images in viewer.  
- Lazy-load heavy components (editor, viewer).

---

# Acceptance Criteria (per Screen)

Every screen is considered **Done** when:
1) Desktop & Mobile layout matches spec (header/left sidebar vs bottom nav).  
2) All actions navigate correctly (happy & unhappy paths).  
3) Accessibility checks pass (keyboard, ARIA, contrast).  
4) Analytics events fire.  
5) API integrations respond with correct state updates.  
6) Error states & toasts appear where defined.

---

**End of Spec**
