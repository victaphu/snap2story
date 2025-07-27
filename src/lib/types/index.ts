export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  title?: string;
  theme?: string;
  subtheme?: string;
  custom_prompt?: string;
  hero_name?: string;
  original_image_url?: string;
  status: 'draft' | 'generating' | 'ready' | 'failed' | 'paid' | 'archived';
  generation_settings?: Record<string, any>;
  payment_intent_id?: string;
  payment_amount?: number;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface StoryPage {
  id: string;
  story_id: string;
  page_num: number;
  page_type: 'front_cover' | 'back_cover' | 'image' | 'text';
  text?: string;
  image_url?: string;
  image_prompt?: string;
  edited_text?: string;
  edited_image_url?: string;
  generation_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomStory {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  payment_intent_id?: string;
  payment_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomPage {
  id: string;
  story_id: string;
  page_num: number;
  text?: string;
  image_url?: string;
  prompt?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  story_id: string;
  story_type: 'ai_generated' | 'custom';
  product_type: 'pdf' | 'softcover' | 'hardcover';
  quantity: number;
  price_cents: number;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'paid' | 'processing' | 'printing' | 'shipped' | 'delivered' | 'failed' | 'refunded';
  shipping_address?: Record<string, any>;
  tracking_number?: string;
  lulu_order_id?: string;
  lulu_status?: string;
  created_at: string;
  updated_at: string;
}

export interface StorySample {
  id: string;
  user_id: string;
  theme?: string;
  hero_name?: string;
  original_image_url?: string;
  custom_prompt?: string;
  sample_data?: Record<string, any>;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
  expires_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  marketing_emails: boolean;
  voice_tips: boolean;
  auto_save: boolean;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  session_id?: string;
  event_name: string;
  properties?: Record<string, any>;
  page_url?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  subthemes?: Subtheme[];
}

export interface Subtheme {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

