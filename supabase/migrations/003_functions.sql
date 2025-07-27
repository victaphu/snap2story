-- Database Functions and Triggers
-- Additional functionality for StoryMosaic

-- Function to clean up expired story samples
CREATE OR REPLACE FUNCTION cleanup_expired_samples()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM story_samples 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_stories', (
      SELECT COUNT(*) FROM stories WHERE user_id = user_uuid AND status = 'ready'
    ),
    'total_custom_stories', (
      SELECT COUNT(*) FROM custom_stories WHERE user_id = user_uuid
    ),
    'total_orders', (
      SELECT COUNT(*) FROM orders WHERE user_id = user_uuid AND status = 'paid'
    ),
    'total_spent_cents', (
      SELECT COALESCE(SUM(price_cents), 0) FROM orders WHERE user_id = user_uuid AND status = 'paid'
    ),
    'stories_this_month', (
      SELECT COUNT(*) FROM stories 
      WHERE user_id = user_uuid 
      AND status = 'ready' 
      AND created_at >= DATE_TRUNC('month', NOW())
    ),
    'member_since', (
      SELECT created_at FROM users WHERE id = user_uuid
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile when they first sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user preferences with defaults
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user preferences
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to soft delete stories (mark as archived instead of hard delete)
CREATE OR REPLACE FUNCTION archive_story(story_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the current user ID
  SELECT id INTO user_uuid FROM users WHERE clerk_id = auth.jwt() ->> 'sub';
  
  -- Check if the story belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM stories 
    WHERE id = story_uuid AND user_id = user_uuid
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update story status to archived instead of deleting
  UPDATE stories 
  SET status = 'archived', updated_at = NOW()
  WHERE id = story_uuid AND user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate story generation cost
CREATE OR REPLACE FUNCTION calculate_story_cost(
  story_type TEXT DEFAULT 'ai_generated',
  page_count INTEGER DEFAULT 20
)
RETURNS INTEGER AS $$
BEGIN
  -- Base cost is $5 (500 cents) for story generation
  RETURN 500;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate printing cost
CREATE OR REPLACE FUNCTION calculate_print_cost(
  product_type TEXT,
  page_count INTEGER DEFAULT 22
)
RETURNS INTEGER AS $$
BEGIN
  CASE product_type
    WHEN 'pdf' THEN RETURN 500;      -- $5.00
    WHEN 'softcover' THEN RETURN 2500; -- $25.00
    WHEN 'hardcover' THEN RETURN 5000; -- $50.00
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- View for user dashboard data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  u.id as user_id,
  u.clerk_id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at as member_since,
  (
    SELECT COUNT(*) FROM stories s 
    WHERE s.user_id = u.id AND s.status = 'ready'
  ) as total_ai_stories,
  (
    SELECT COUNT(*) FROM custom_stories cs 
    WHERE cs.user_id = u.id
  ) as total_custom_stories,
  (
    SELECT COUNT(*) FROM orders o 
    WHERE o.user_id = u.id AND o.status IN ('paid', 'processing', 'printing', 'shipped', 'delivered')
  ) as total_orders,
  (
    SELECT COALESCE(SUM(o.price_cents), 0) FROM orders o 
    WHERE o.user_id = u.id AND o.status IN ('paid', 'processing', 'printing', 'shipped', 'delivered')
  ) as total_spent_cents
FROM users u;

-- Materialized view for analytics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE event_name = 'story_created') as stories_created,
  COUNT(*) FILTER (WHERE event_name = 'order_completed') as orders_completed,
  COALESCE(SUM((properties->>'amount_cents')::INTEGER) FILTER (WHERE event_name = 'order_completed'), 0) as revenue_cents
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);

-- Function to refresh analytics (call this via cron job)
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
END;
$$ LANGUAGE plpgsql;