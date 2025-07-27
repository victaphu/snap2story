-- Row Level Security Policies
-- Ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from Clerk ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM users WHERE clerk_id = auth.jwt() ->> 'sub';
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Stories table policies
CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (user_id = get_current_user_id());

-- Story pages table policies
CREATE POLICY "Users can view their own story pages" ON story_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can create their own story pages" ON story_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can update their own story pages" ON story_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can delete their own story pages" ON story_pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_pages.story_id 
      AND stories.user_id = get_current_user_id()
    )
  );

-- Custom stories table policies
CREATE POLICY "Users can view their own custom stories" ON custom_stories
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own custom stories" ON custom_stories
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own custom stories" ON custom_stories
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own custom stories" ON custom_stories
  FOR DELETE USING (user_id = get_current_user_id());

-- Custom pages table policies
CREATE POLICY "Users can view their own custom pages" ON custom_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_stories 
      WHERE custom_stories.id = custom_pages.story_id 
      AND custom_stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can create their own custom pages" ON custom_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_stories 
      WHERE custom_stories.id = custom_pages.story_id 
      AND custom_stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can update their own custom pages" ON custom_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM custom_stories 
      WHERE custom_stories.id = custom_pages.story_id 
      AND custom_stories.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can delete their own custom pages" ON custom_pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM custom_stories 
      WHERE custom_stories.id = custom_pages.story_id 
      AND custom_stories.user_id = get_current_user_id()
    )
  );

-- Orders table policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (user_id = get_current_user_id());

-- Story samples table policies
CREATE POLICY "Users can view their own story samples" ON story_samples
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own story samples" ON story_samples
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own story samples" ON story_samples
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own story samples" ON story_samples
  FOR DELETE USING (user_id = get_current_user_id());

-- User preferences table policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = get_current_user_id());

-- Analytics events table policies (users can only insert, not read)
CREATE POLICY "Users can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Admin policies (for service role key)
CREATE POLICY "Service role has full access to all tables" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to stories" ON stories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to story_pages" ON story_pages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to custom_stories" ON custom_stories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to custom_pages" ON custom_pages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to story_samples" ON story_samples
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_preferences" ON user_preferences
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to analytics_events" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');