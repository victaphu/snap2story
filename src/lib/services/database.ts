import { supabase, supabaseAdmin } from './supabase';
import type {
  User,
  Story,
  StoryPage,
  CustomStory,
  CustomPage,
  Order,
  StorySample,
  UserPreferences,
  AnalyticsEvent,
  Profile,
  Book,
  BookPage,
  OrderV2,
  Referral,
  Reminder,
  UploadRecord,
} from '../types';

export class DatabaseService {
  // User operations
  static async createUser(clerkId: string, email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert({ clerk_id: clerkId, email })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  }

  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  // Story operations
  static async createStory(userId: string, storyData: Partial<Story>): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .insert({ user_id: userId, ...storyData })
      .select()
      .single();

    if (error) {
      console.error('Error creating story:', error);
      return null;
    }

    return data;
  }

  static async getStory(storyId: string): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error fetching story:', error);
      return null;
    }

    return data;
  }

  static async getUserStories(userId: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stories:', error);
      return [];
    }

    return data || [];
  }

  static async updateStory(storyId: string, updates: Partial<Story>): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating story:', error);
      return null;
    }

    return data;
  }

  static async deleteStory(storyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      console.error('Error deleting story:', error);
      return false;
    }

    return true;
  }

  // Story pages operations
  static async createStoryPages(pages: Omit<StoryPage, 'id'>[]): Promise<StoryPage[]> {
    const { data, error } = await supabase
      .from('story_pages')
      .insert(pages)
      .select();

    if (error) {
      console.error('Error creating story pages:', error);
      return [];
    }

    return data || [];
  }

  static async getStoryPages(storyId: string): Promise<StoryPage[]> {
    const { data, error } = await supabase
      .from('story_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_num');

    if (error) {
      console.error('Error fetching story pages:', error);
      return [];
    }

    return data || [];
  }

  static async updateStoryPage(pageId: string, updates: Partial<StoryPage>): Promise<StoryPage | null> {
    const { data, error } = await supabase
      .from('story_pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating story page:', error);
      return null;
    }

    return data;
  }

  // Custom story operations
  static async createCustomStory(userId: string, title: string): Promise<CustomStory | null> {
    const { data, error } = await supabase
      .from('custom_stories')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom story:', error);
      return null;
    }

    return data;
  }

  static async getCustomStory(storyId: string): Promise<CustomStory | null> {
    const { data, error } = await supabase
      .from('custom_stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) {
      console.error('Error fetching custom story:', error);
      return null;
    }

    return data;
  }

  static async getUserCustomStories(userId: string): Promise<CustomStory[]> {
    const { data, error } = await supabase
      .from('custom_stories')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user custom stories:', error);
      return [];
    }

    return data || [];
  }

  // Custom pages operations
  static async createCustomPages(pages: Omit<CustomPage, 'id'>[]): Promise<CustomPage[]> {
    const { data, error } = await supabase
      .from('custom_pages')
      .insert(pages)
      .select();

    if (error) {
      console.error('Error creating custom pages:', error);
      return [];
    }

    return data || [];
  }

  static async getCustomPages(storyId: string): Promise<CustomPage[]> {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('story_id', storyId)
      .order('page_num');

    if (error) {
      console.error('Error fetching custom pages:', error);
      return [];
    }

    return data || [];
  }

  static async updateCustomPage(pageId: string, updates: Partial<CustomPage>): Promise<CustomPage | null> {
    const { data, error } = await supabase
      .from('custom_pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating custom page:', error);
      return null;
    }

    return data;
  }

  // Order operations
  static async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return data;
  }

  static async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data;
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    return data || [];
  }

  static async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return null;
    }

    return data;
  }

  // Story samples operations
  static async createStorySample(sampleData: Omit<StorySample, 'id' | 'created_at' | 'expires_at'>): Promise<StorySample | null> {
    const { data, error } = await supabase
      .from('story_samples')
      .insert(sampleData)
      .select()
      .single();

    if (error) {
      console.error('Error creating story sample:', error);
      return null;
    }

    return data;
  }

  static async getStorySample(sampleId: string): Promise<StorySample | null> {
    const { data, error } = await supabase
      .from('story_samples')
      .select('*')
      .eq('id', sampleId)
      .single();

    if (error) {
      console.error('Error fetching story sample:', error);
      return null;
    }

    return data;
  }

  static async updateStorySample(sampleId: string, updates: Partial<StorySample>): Promise<StorySample | null> {
    const { data, error } = await supabase
      .from('story_samples')
      .update(updates)
      .eq('id', sampleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating story sample:', error);
      return null;
    }

    return data;
  }

  static async getUserStorySamples(userId: string): Promise<StorySample[]> {
    const { data, error } = await supabase
      .from('story_samples')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user story samples:', error);
      return [];
    }

    return data || [];
  }

  // User preferences operations
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...preferences })
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }

    return data;
  }

  // Analytics operations
  static async trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<boolean> {
    const { error } = await supabase
      .from('analytics_events')
      .insert(eventData);

    if (error) {
      console.error('Error tracking analytics event:', error);
      return false;
    }

    return true;
  }

  // Enhanced user operations
  static async createOrUpdateUser(clerkId: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .upsert({ clerk_id: clerkId, ...userData })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating user:', error);
      return null;
    }

    return data;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  }

  // Enhanced story operations with payment tracking
  static async createStoryWithPayment(
    userId: string, 
    storyData: Partial<Story>,
    paymentIntentId?: string,
    paymentAmount?: number
  ): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .insert({ 
        user_id: userId, 
        payment_intent_id: paymentIntentId,
        payment_amount: paymentAmount,
        status: paymentIntentId ? 'paid' : 'draft',
        ...storyData 
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating story with payment:', error);
      return null;
    }

    return data;
  }

  static async markStoryAsPaid(storyId: string, paymentIntentId: string, amount: number): Promise<Story | null> {
    const { data, error } = await supabase
      .from('stories')
      .update({ 
        status: 'paid', 
        payment_intent_id: paymentIntentId,
        payment_amount: amount
      })
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      console.error('Error marking story as paid:', error);
      return null;
    }

    return data;
  }

  // Admin operations (using service role)
  static async getUserStats(userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .rpc('get_user_stats', { user_uuid: userId });

    if (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }

    return data;
  }

  static async cleanupExpiredSamples(): Promise<number> {
    const { data, error } = await supabaseAdmin
      .rpc('cleanup_expired_samples');

    if (error) {
      console.error('Error cleaning up expired samples:', error);
      return 0;
    }

    return data || 0;
  }

  // Utility functions
  static async getStoriesWithPages(userId: string): Promise<(Story & { pages: StoryPage[] })[]> {
    const stories = await this.getUserStories(userId);
    const storiesWithPages = await Promise.all(
      stories.map(async (story) => {
        const pages = await this.getStoryPages(story.id);
        return { ...story, pages };
      })
    );

    return storiesWithPages;
  }

  static async getCustomStoriesWithPages(userId: string): Promise<(CustomStory & { pages: CustomPage[] })[]> {
    const stories = await this.getUserCustomStories(userId);
    const storiesWithPages = await Promise.all(
      stories.map(async (story) => {
        const pages = await this.getCustomPages(story.id);
        return { ...story, pages };
      })
    );

    return storiesWithPages;
  }
}

// Brief-driven API (profiles/books/etc.) aligned to new schema.
export class BriefDB {
  // Profiles
  static async upsertProfileByClerk(clerkId: string, email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ clerk_id: clerkId, email }, { onConflict: 'clerk_id' })
      .select()
      .single();
    if (error) {
      console.error('profiles upsert error:', error);
      return null;
    }
    return data as Profile;
  }

  static async getProfileByClerk(clerkId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    if (error) return null;
    return data as Profile;
  }

  // Books
  static async createBook(userId: string, payload: Partial<Book>): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .insert({ user_id: userId, ...payload })
      .select()
      .single();
    if (error) {
      console.error('books insert error:', error);
      return null;
    }
    return data as Book;
  }

  static async getBook(bookId: string): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();
    if (error) return null;
    return data as Book;
  }

  static async getUserBooks(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as Book[];
  }

  static async updateBook(bookId: string, updates: Partial<Book>): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single();
    if (error) return null;
    return data as Book;
  }

  static async deleteBook(bookId: string): Promise<boolean> {
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    return !error;
  }

  // Book pages
  static async upsertBookPages(pages: Omit<BookPage, 'id' | 'created_at'>[]): Promise<BookPage[]> {
    const { data, error } = await supabase
      .from('book_pages')
      .upsert(pages, { onConflict: 'book_id,page_number' })
      .select();
    if (error) {
      console.error('book_pages upsert error:', error);
      return [];
    }
    return (data || []) as BookPage[];
  }

  static async getBookPages(bookId: string): Promise<BookPage[]> {
    const { data, error } = await supabase
      .from('book_pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number');
    if (error) return [];
    return (data || []) as BookPage[];
  }

  // Orders v2
  static async createOrder(userId: string, payload: Omit<OrderV2, 'id' | 'user_id' | 'created_at'>): Promise<OrderV2 | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert({ user_id: userId, ...payload })
      .select()
      .single();
    if (error) {
      console.error('orders insert error:', error);
      return null;
    }
    return data as OrderV2;
  }

  static async getUserOrders(userId: string): Promise<OrderV2[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as OrderV2[];
  }

  static async updateOrder(orderId: string, updates: Partial<OrderV2>): Promise<OrderV2 | null> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();
    if (error) return null;
    return data as OrderV2;
  }

  // Referrals
  static async addReferral(payload: Omit<Referral, 'id' | 'created_at'>): Promise<Referral | null> {
    const { data, error } = await supabase.from('referrals').insert(payload).select().single();
    if (error) return null;
    return data as Referral;
  }
  static async getReferrals(referrerId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as Referral[];
  }

  // Reminders
  static async addReminder(userId: string, payload: Partial<Reminder>): Promise<Reminder | null> {
    const { data, error } = await supabase
      .from('reminders')
      .insert({ user_id: userId, ...payload })
      .select()
      .single();
    if (error) return null;
    return data as Reminder;
  }
  static async listReminders(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('date');
    if (error) return [];
    return (data || []) as Reminder[];
  }

  // Uploads
  static async addUpload(userId: string, fileUrl: string, kind: UploadRecord['kind']): Promise<UploadRecord | null> {
    const { data, error } = await supabase
      .from('uploads')
      .insert({ user_id: userId, file_url: fileUrl, kind })
      .select()
      .single();
    if (error) return null;
    return data as UploadRecord;
  }
  static async listUploads(userId: string): Promise<UploadRecord[]> {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as UploadRecord[];
  }

  // Loyalty points
  static async incrementPoints(profileId: string, delta: number): Promise<Profile | null> {
    // Fetch current points, then update with increment
    const { data: current, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    if (fetchErr || !current) return null;
    const next = (current.points || 0) + delta;
    const { data: updated } = await supabase
      .from('profiles')
      .update({ points: next })
      .eq('id', profileId)
      .select()
      .single();
    return (updated || null) as Profile | null;
  }
}
