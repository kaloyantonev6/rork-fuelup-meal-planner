
-- Recipe comments
CREATE TABLE public.recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recipe ratings
CREATE TABLE public.recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (recipe_id, user_id)
);

-- Recipe likes
CREATE TABLE public.recipe_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- Comment likes
CREATE TABLE public.comment_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.recipe_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

-- AI Coach conversations
CREATE TABLE public.ai_coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Coach messages
CREATE TABLE public.ai_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_coach_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progress logs
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,1),
  calories_consumed INTEGER,
  protein_g DECIMAL(6,1),
  carbs_g DECIMAL(6,1),
  fats_g DECIMAL(6,1),
  mood TEXT CHECK (mood IN ('great','good','okay','tired','exhausted')),
  notes TEXT,
  UNIQUE (user_id, date)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Notification preferences
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_meal_reminder BOOLEAN DEFAULT true,
  meal_reminder_time TIME DEFAULT '09:00',
  ai_coach_insights BOOLEAN DEFAULT true,
  recipe_interactions BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false
);

-- PDF exports
CREATE TABLE public.pdf_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('meal_plan','shopping_list')),
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "anyone_reads_comments" ON public.recipe_comments FOR SELECT USING (true);
CREATE POLICY "users_create_comments" ON public.recipe_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_comments" ON public.recipe_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_comments" ON public.recipe_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "anyone_reads_ratings" ON public.recipe_ratings FOR SELECT USING (true);
CREATE POLICY "users_crud_own_ratings" ON public.recipe_ratings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "anyone_reads_likes" ON public.recipe_likes FOR SELECT USING (true);
CREATE POLICY "users_crud_own_likes" ON public.recipe_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "anyone_reads_comment_likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "users_crud_own_comment_likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_crud_own_conversations" ON public.ai_coach_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_crud_own_messages" ON public.ai_coach_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.ai_coach_conversations WHERE id = ai_coach_messages.conversation_id AND user_id = auth.uid()));

CREATE POLICY "users_crud_own_progress" ON public.progress_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_crud_own_notif_prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_exports" ON public.pdf_exports FOR SELECT USING (auth.uid() = user_id);

-- Triggers for denormalized counters
CREATE OR REPLACE FUNCTION public.fn_update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.recipes SET likes_count = likes_count + 1 WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.recipes SET likes_count = likes_count - 1 WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_recipe_like_change
  AFTER INSERT OR DELETE ON public.recipe_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_recipe_likes_count();

CREATE OR REPLACE FUNCTION public.fn_update_recipe_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.recipes SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.recipe_ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    rating_count = (SELECT COUNT(*) FROM public.recipe_ratings WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id))
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_recipe_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_recipe_rating_stats();

CREATE OR REPLACE FUNCTION public.fn_update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.recipe_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.recipe_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_comment_likes_count();

CREATE OR REPLACE FUNCTION public.fn_update_recipe_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.recipes SET comments_count = comments_count + 1 WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.recipes SET comments_count = comments_count - 1 WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.recipe_comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_recipe_comments_count();
