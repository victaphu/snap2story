# Supabase Database Setup Guide

This guide will help you set up the Supabase database for StoryMosaic.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Setup Steps

### 1. Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `storymosaic` (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose the closest to your users
5. Click "Create new project"

### 2. Get Your Environment Variables

Once your project is ready:

1. Go to Project Settings → API
2. Copy the following values to your `.env.local` file:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API keys → `anon` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Project API keys → `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Database Migrations

In your Supabase dashboard:

1. Go to SQL Editor
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. Repeat for `002_rls_policies.sql` and `003_functions.sql`

Alternatively, if you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migrations
supabase db push
```

### 4. Set Up Authentication Integration

1. In your Supabase dashboard, go to Authentication → Settings
2. Scroll down to "Additional Configuration"
3. Enable "Use custom SMTP server" if you want custom email templates
4. Configure OAuth providers if needed (Google, GitHub, etc.)

### 5. Configure Storage (Optional)

If you plan to store images in Supabase Storage:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called "story-images"
3. Set the bucket to public if you want direct URL access
4. Configure upload policies as needed

### 6. Set Up Row Level Security

The RLS policies are included in the migration files. They ensure:

- Users can only access their own data
- Proper authentication is required for all operations
- Service role has admin access for backend operations

### 7. Test the Connection

Create a simple test file to verify your connection:

```typescript
// test-db.ts
import { supabase } from './src/lib/services/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .single();
    
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful!');
  }
}

testConnection();
```

## Database Schema Overview

### Core Tables

- **users**: User profiles linked to Clerk authentication
- **stories**: AI-generated stories with payment tracking
- **story_pages**: Individual pages of AI-generated stories
- **custom_stories**: User-created stories
- **custom_pages**: Pages of custom stories
- **orders**: Physical book orders
- **story_samples**: Preview samples (expire after 24 hours)
- **user_preferences**: User settings and preferences
- **analytics_events**: Event tracking for analytics

### Key Features

- **Automatic timestamps**: All tables have `created_at` and `updated_at` fields
- **Row Level Security**: Users can only access their own data
- **Soft deletes**: Stories can be archived instead of deleted
- **Payment tracking**: Integration with Stripe payment intents
- **Analytics**: Built-in event tracking system
- **Sample cleanup**: Automatic cleanup of expired samples

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Integration with Your App

The database is already integrated with your Next.js app through:

1. **Database Service**: `src/lib/services/database.ts`
2. **User Sync Hook**: `src/lib/hooks/useUserSync.ts`
3. **User Context**: `src/lib/contexts/UserContext.tsx`
4. **TypeScript Types**: `src/lib/types/index.ts`

## Next Steps

1. Set up your environment variables
2. Run the database migrations
3. Test the connection
4. Start using the DatabaseService in your components
5. Implement the UserProvider in your app layout

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check your environment variables
2. **RLS Violations**: Ensure user is authenticated with Clerk
3. **Migration Errors**: Run migrations in order
4. **Permission Errors**: Check if RLS policies are correctly applied

### Getting Help

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check the browser console for detailed error messages

## Production Considerations

1. **Backup Strategy**: Set up automated backups
2. **Monitoring**: Enable database metrics and alerts
3. **Performance**: Add indexes for frequently queried fields
4. **Security**: Regularly audit RLS policies
5. **Scaling**: Monitor database performance and upgrade as needed