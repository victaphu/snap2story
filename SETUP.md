# StoryMosaic Setup Guide

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

## Environment Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd snap2story
npm install
```

### 2. Environment Variables
Copy the `.env.local.example` file to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

### 3. Clerk Authentication Setup
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your publishable key and secret key
4. Update `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_here
```

### 4. Supabase Database Setup
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > API to get your keys
4. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

5. Run the database schema:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the script

### 5. Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or next available port).

## Features Available Without Setup

The application is designed to work even without complete environment setup:

- **Landing Page**: Full functionality for unauthenticated users
- **UI Components**: All design system components work
- **Responsive Design**: Desktop and mobile layouts
- **Build Process**: Application builds successfully

## Features Requiring Setup

- **Authentication**: Sign in/up requires Clerk configuration
- **Database Operations**: Story creation/management requires Supabase
- **AI Generation**: Image editing requires Qwen API key (DashScope) or OpenAI API key
- **Payments**: Purchase flow requires Stripe configuration

## Testing

```bash
# Run build test
npm run build

# Run development server
npm run dev

# Run linting
npm run lint
```

## Architecture

- **Frontend**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI (GPT + DALL-E)
- **Payments**: Stripe
- **Print**: Lulu xPress API

## Book Structure

- **Total Pages**: 22 (Front cover + 10 image pages + 10 text pages + Back cover)
- **Content Pages**: 20 (10 images + 10 text)
- **AI Generation**: Creates both illustrations and story text
- **Formats**: PDF download, Softcover print, Hardcover print
