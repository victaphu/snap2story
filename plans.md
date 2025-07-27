# StoryMosaic Implementation Plan

## Project Overview
StoryMosaic is a web application that allows users to create personalized picture books using AI. The app supports both desktop and mobile experiences with different navigation patterns, integrates with multiple services (Clerk, Supabase, OpenAI, Stripe, Lulu), and provides a complete workflow from story creation to physical book printing.

**Book Structure**: 22-page books (front cover + 10 image pages + 10 text pages + back cover)
**User Experience**: Landing page for visitors, authenticated dashboard for users

## Technology Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Authentication**: Clerk
- **Database & Storage**: Supabase (PostgreSQL + Storage)
- **AI Services**: OpenAI (GPT for text, DALL-E for images)
- **Payments**: Stripe
- **Print Fulfillment**: Lulu xPress API
- **Analytics**: PostHog
- **CRM**: HubSpot
- **Hosting**: Vercel/Netlify (with Edge/Background Functions)

## Implementation Phases

### Phase 1: Foundation Setup (Week 1)
- [x] **1.1 Project Structure**
  - Set up Next.js with TypeScript
  - Configure ESLint, Prettier
  - Set up environment variables structure
  - Configure path aliases

- [x] **1.2 Core Dependencies**
  - Install and configure Tailwind CSS
  - Set up shadcn/ui components
  - Install required packages (clerk, supabase-js, stripe, etc.)

- [x] **1.3 Authentication Setup**
  - Configure Clerk provider
  - Set up middleware for protected routes
  - Create auth context/hooks
  - Implement sign-in/sign-up flows

- [x] **1.4 Database Setup**
  - Create Supabase project schema
  - Define database schema:
    - `users` table
    - `stories` table
    - `story_pages` table
    - `custom_stories` table
    - `custom_pages` table
    - `orders` table
  - Set up Row Level Security (RLS) policies
  - Configure storage buckets (heroes/, pages/, exports/)

- [x] **1.5 Layout System**
  - Create responsive layout components
  - Desktop: Header + Left Sidebar
  - Mobile: Top Bar + Bottom Navigation
  - Implement breakpoint system (≤640px mobile, 641-1024px tablet, ≥1025px desktop)

### Phase 2: Design System & Common Components (Week 1-2)
- [x] **2.1 Visual System**
  - Configure color scheme (pastel cream, lavender, soft blue, coral)
  - Set up typography scale (16-20px body, 24-32px titles)
  - Ensure WCAG AA contrast compliance

- [x] **2.2 Common Components**
  - Primary/Secondary buttons (48x48px min touch targets)
  - Card component (soft shadow, large padding)
  - Progress ring with numeric counter
  - Toast notifications (top-right desktop, top mobile)
  - Form inputs with error states
  - Loading skeletons
  - Modal/Dialog components

- [x] **2.3 Navigation Components**
  - Desktop sidebar with icons + labels
  - Mobile bottom navigation (5 items)
  - Floating Action Button (FAB) for mobile
  - Breadcrumb navigation

### Phase 3: Core User Flows (Week 2-3)
- [x] **3.1 Home/Welcome Screen**
  - Landing page for unauthenticated users with signup CTAs
  - Authenticated dashboard with 2x2 grid layout (Create, My Stories, Help, Account)
  - Responsive design for mobile/desktop
  - FAB implementation for mobile
  - Updated messaging for 20-page book structure (10 images + 10 text + covers)

- [ ] **3.2 Story Creation Flow**
  - **Upload Heroes** (/create/upload-heroes)
    - Drag & drop interface
    - Image validation (PNG/JPG, ≤10MB, max 3)
    - Skip option
    - Upload to Supabase Storage
  
  - **Choose Theme** (/create/choose-theme)
    - 2x3 grid of theme tiles
    - Theme categories: Bedtime, Family Adventures, Celebrations, Travel, Visiting Places, Custom
    - Subtheme selection screens
  
  - **Describe Story** (/create/describe)
    - Text input (300-500 chars)
    - Voice input with Web Speech API
    - Tips panel (desktop only)

### Phase 4: AI Integration & Generation (Week 3-4)
- [ ] **4.1 OpenAI Integration**
  - Set up API endpoints (Netlify/Vercel Functions)
  - `/api/story/generate` - Generate story outline and page texts
  - `/api/image/generate` - Generate images with DALL-E
  - Error handling and retry logic

- [ ] **4.2 Processing Screen**
  - Progress ring showing X/40 pages
  - Real-time updates (Supabase Realtime or polling)
  - Cancel functionality
  - Background function for orchestration
  - Save progress to database

- [ ] **4.3 Generation Flow**
  - Queue management for API calls
  - Exponential backoff for failures
  - Partial completion handling
  - Resume capability

### Phase 5: Book Viewer & Editor (Week 4-5)
- [ ] **5.1 Digital Book Viewer** (/book/{storyId}/viewer)
  - Desktop: Two-page spread view
  - Mobile: Single-page swipe view
  - Page navigation controls
  - Zoom functionality
  - Lazy loading for images
  - PWA offline caching

- [ ] **5.2 Edit Mode** (AI-generated stories)
  - Caption editing interface
  - Image replacement/regeneration
  - Save/Cancel functionality
  - Convert to Custom option
  - Audit trail for edits

- [ ] **5.3 Custom Adventure Editor** (up to 10 pages)
  - Page management (add/delete/reorder)
  - Drag-and-drop for desktop
  - Text and image editing per page
  - Image generation integration
  - Preview functionality
  - Auto-save drafts

### Phase 6: E-commerce Integration (Week 5-6)
- [ ] **6.1 Pricing & Purchase Options**
  - Book Ready screen with pricing grid
  - Download Soft Copy ($5)
  - Print Softcover ($25)
  - Print Hardcover ($50)
  - Retry credits display

- [ ] **6.2 Stripe Integration**
  - Checkout session creation
  - Payment processing
  - Webhook handling
  - Order status updates
  - Invoice generation

- [ ] **6.3 PDF Generation**
  - Background function for PDF creation
  - High-quality export (print-ready)
  - Signed URL generation for downloads
  - Expiry handling

### Phase 7: Print Fulfillment (Week 6)
- [ ] **7.1 Lulu Integration**
  - xPress API integration
  - Job creation workflow
  - Status webhook handling
  - Shipping address validation

- [ ] **7.2 Order Management**
  - Orders listing page
  - Status tracking (paid, production, shipped)
  - Download links for digital orders
  - Invoice viewing

### Phase 8: User Account & Library (Week 7)
- [ ] **8.1 My Stories (Library)**
  - Grid/list view toggle
  - Filters (theme, date, status)
  - Actions (View, Edit, Order, Delete)
  - Empty state handling

- [ ] **8.2 Account Settings**
  - Profile management (via Clerk)
  - Payment methods
  - Accessibility preferences
  - Notification settings
  - Address management

### Phase 9: Support & Help (Week 7)
- [ ] **9.1 Help Center**
  - FAQ accordion
  - Quick links
  - Search functionality

- [ ] **9.2 Support Integration**
  - Intercom/Crisp chat widget
  - HubSpot ticket creation
  - Contact form

### Phase 10: Analytics & Monitoring (Week 8)
- [ ] **10.1 PostHog Integration**
  - Event tracking implementation
  - User identification
  - Feature flags setup
  - A/B testing framework

- [ ] **10.2 Event Tracking**
  - Page views
  - User actions
  - Conversion funnel
  - Error tracking

### Phase 11: PWA & Performance (Week 8)
- [ ] **11.1 PWA Setup**
  - Service worker configuration
  - App manifest
  - Install prompts
  - Offline functionality

- [ ] **11.2 Performance Optimization**
  - Image optimization
  - Code splitting
  - Lazy loading
  - Caching strategies
  - Core Web Vitals optimization

### Phase 12: Testing & QA (Week 9)
- [ ] **12.1 Unit Testing**
  - Component tests
  - Utility function tests
  - API endpoint tests

- [ ] **12.2 Integration Testing**
  - User flow testing
  - API integration tests
  - Payment flow testing

- [ ] **12.3 E2E Testing**
  - Critical path testing
  - Cross-browser testing
  - Mobile responsiveness

### Phase 13: Deployment & Launch (Week 9-10)
- [ ] **13.1 Deployment Setup**
  - CI/CD pipeline
  - Environment configuration
  - Database migrations
  - Edge function deployment

- [ ] **13.2 Monitoring**
  - Error tracking (Sentry)
  - Performance monitoring
  - Uptime monitoring
  - Log aggregation

- [ ] **13.3 Launch Preparation**
  - Security audit
  - Load testing
  - Backup procedures
  - Rollback plan

## API Endpoints

### Story Generation
- `POST /api/story/generate` - Generate story outline and texts
- `POST /api/image/generate` - Generate individual page images
- `GET /api/story/status?storyId` - Poll generation status

### Export & Orders
- `POST /api/export/pdf` - Generate PDF for story
- `POST /api/checkout/session` - Create Stripe checkout
- `POST /api/stripe/webhook` - Handle Stripe events
- `POST /api/print/order` - Create Lulu print job
- `POST /api/print/webhook` - Handle Lulu status updates

### User & Support
- `POST /api/hubspot/contact` - Sync user to HubSpot
- `POST /api/hubspot/event` - Track events in HubSpot

## Key Considerations

### Accessibility
- WCAG AA compliance for contrast
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- ARIA labels for interactive elements

### Error Handling
- Network failures with retry logic
- API quota exceeded messages
- Payment failures with clear messaging
- Unsaved changes warnings
- Graceful degradation

### Security
- Implement RLS on all Supabase tables
- Validate all user inputs
- Secure file uploads
- API rate limiting
- CORS configuration

### Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1
- Lazy load images and heavy components

## Success Metrics
- User can complete story creation in < 5 minutes
- 95%+ uptime for all services
- < 2% payment failure rate
- Mobile experience matches desktop functionality
- All screens pass accessibility audit

## Risk Mitigation
- API rate limits: Implement queuing and caching
- Large file handling: Progressive uploads and processing
- Payment failures: Clear retry flows
- Print errors: Manual intervention process
- AI generation failures: Fallback templates

---

*This plan will be updated as tasks are completed. Check marks indicate completed items.*