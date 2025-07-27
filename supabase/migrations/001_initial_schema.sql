-- StoryMosaic Database Schema
-- Initial migration for core tables

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Users table (linked to Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table (AI-generated stories)
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  theme TEXT,
  subtheme TEXT,
  custom_prompt TEXT,
  hero_name TEXT,
  original_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed', 'paid')),
  generation_settings JSONB DEFAULT '{}',
  payment_intent_id TEXT,
  payment_amount INTEGER, -- in cents
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story pages table
CREATE TABLE IF NOT EXISTS story_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_num INTEGER NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('front_cover', 'back_cover', 'image', 'text')),
  text TEXT,
  image_url TEXT,
  image_prompt TEXT,
  edited_text TEXT,
  edited_image_url TEXT,
  generation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, page_num)
);

-- Custom stories table (user-created stories)
CREATE TABLE IF NOT EXISTS custom_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  payment_intent_id TEXT,
  payment_amount INTEGER, -- in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom pages table
CREATE TABLE IF NOT EXISTS custom_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES custom_stories(id) ON DELETE CASCADE,
  page_num INTEGER NOT NULL,
  text TEXT,
  image_url TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, page_num)
);

-- Orders table (for physical book orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  story_id UUID, -- Can reference either stories or custom_stories
  story_type TEXT CHECK (story_type IN ('ai_generated', 'custom')),
  product_type TEXT NOT NULL CHECK (product_type IN ('pdf', 'softcover', 'hardcover')),
  quantity INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'printing', 'shipped', 'delivered', 'failed', 'refunded')),
  shipping_address JSONB,
  tracking_number TEXT,
  lulu_order_id TEXT,
  lulu_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story samples table (for preview generation)
CREATE TABLE IF NOT EXISTS story_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT,
  hero_name TEXT,
  original_image_url TEXT,
  custom_prompt TEXT,
  sample_data JSONB, -- stores the 3-page preview
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  voice_tips BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_page_num ON story_pages(story_id, page_num);
CREATE INDEX IF NOT EXISTS idx_custom_stories_user_id ON custom_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_pages_story_id ON custom_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_story_samples_user_id ON story_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_story_samples_expires_at ON story_samples(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Set up updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_pages_updated_at BEFORE UPDATE ON story_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_stories_updated_at BEFORE UPDATE ON custom_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_pages_updated_at BEFORE UPDATE ON custom_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();