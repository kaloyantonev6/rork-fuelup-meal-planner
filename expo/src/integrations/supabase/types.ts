/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_coach_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coach_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_trackers: {
        Row: {
          created_at: string | null
          id: string
          meal_plan_id: string
          remaining_eur: number | null
          spent_eur: number | null
          updated_at: string | null
          user_id: string
          weekly_budget_eur: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_plan_id: string
          remaining_eur?: number | null
          spent_eur?: number | null
          updated_at?: string | null
          user_id: string
          weekly_budget_eur: number
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_plan_id?: string
          remaining_eur?: number | null
          spent_eur?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_budget_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_trackers_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: true
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_trackers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_meals: {
        Row: {
          calories: number | null
          created_at: string | null
          id: string
          image_url: string | null
          macros: Json | null
          meal_name: string
          meal_plan_item_id: string | null
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          macros?: Json | null
          meal_name: string
          meal_plan_item_id?: string | null
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          macros?: Json | null
          meal_name?: string
          meal_plan_item_id?: string | null
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_meals_meal_plan_item_id_fkey"
            columns: ["meal_plan_item_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_retailers: {
        Row: {
          country_code: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          rank: number | null
          website_url: string | null
        }
        Insert: {
          country_code: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          rank?: number | null
          website_url?: string | null
        }
        Update: {
          country_code?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          rank?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      ingredient_prices: {
        Row: {
          id: string
          ingredient_name: string
          last_updated: string | null
          price_eur: number
          quantity_per_unit: number | null
          retailer_id: string
          source: string | null
          unit: string
        }
        Insert: {
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price_eur: number
          quantity_per_unit?: number | null
          retailer_id: string
          source?: string | null
          unit: string
        }
        Update: {
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price_eur?: number
          quantity_per_unit?: number | null
          retailer_id?: string
          source?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_prices_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "grocery_retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          calories: number
          carbs_g: number | null
          cost_estimate_eur: number | null
          day_number: number
          fats_g: number | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string | null
          meal_name: string
          meal_plan_id: string
          meal_slot: string
          prep_time_min: number | null
          protein_g: number | null
          recipe_id: string | null
          tutorial_steps: Json | null
        }
        Insert: {
          calories: number
          carbs_g?: number | null
          cost_estimate_eur?: number | null
          day_number: number
          fats_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          meal_name: string
          meal_plan_id: string
          meal_slot: string
          prep_time_min?: number | null
          protein_g?: number | null
          recipe_id?: string | null
          tutorial_steps?: Json | null
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          cost_estimate_eur?: number | null
          day_number?: number
          fats_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string | null
          meal_name?: string
          meal_plan_id?: string
          meal_slot?: string
          prep_time_min?: number | null
          protein_g?: number | null
          recipe_id?: string | null
          tutorial_steps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          duration_days: number
          folder_id: string | null
          generation_model: string | null
          id: string
          is_saved: boolean | null
          profile_snapshot: Json
          target_calories: number | null
          target_carbs_g: number | null
          target_fats_g: number | null
          target_protein_g: number | null
          title: string
          user_id: string
          weekly_budget: number | null
        }
        Insert: {
          created_at?: string | null
          duration_days: number
          folder_id?: string | null
          generation_model?: string | null
          id?: string
          is_saved?: boolean | null
          profile_snapshot?: Json
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          target_protein_g?: number | null
          title: string
          user_id: string
          weekly_budget?: number | null
        }
        Update: {
          created_at?: string | null
          duration_days?: number
          folder_id?: string | null
          generation_model?: string | null
          id?: string
          is_saved?: boolean | null
          profile_snapshot?: Json
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          target_protein_g?: number | null
          title?: string
          user_id?: string
          weekly_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "plan_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          ai_coach_insights: boolean | null
          daily_meal_reminder: boolean | null
          meal_reminder_time: string | null
          recipe_interactions: boolean | null
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          ai_coach_insights?: boolean | null
          daily_meal_reminder?: boolean | null
          meal_reminder_time?: string | null
          recipe_interactions?: boolean | null
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          ai_coach_insights?: boolean | null
          daily_meal_reminder?: boolean | null
          meal_reminder_time?: string | null
          recipe_interactions?: boolean | null
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_exports: {
        Row: {
          created_at: string | null
          expires_at: string | null
          file_size_bytes: number | null
          id: string
          meal_plan_id: string | null
          storage_path: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          meal_plan_id?: string | null
          storage_path: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          id?: string
          meal_plan_id?: string | null
          storage_path?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_exports_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          auto_regenerate: boolean | null
          avatar_url: string | null
          bmr_cached: number | null
          budget_preference: string | null
          cooking_skill: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          dark_mode: boolean | null
          diet_type: string | null
          disliked_ingredients: string[] | null
          display_name: string | null
          email: string
          fitness_goal: string | null
          full_name: string | null
          gender: string | null
          height: number | null
          height_cm: number | null
          id: string
          intolerances: string[] | null
          kitchen_equipment: string[] | null
          onboarding_complete: boolean | null
          preferences: Json | null
          region: string | null
          subscription_tier: string | null
          target_weight_kg: number | null
          tdee_cached: number | null
          updated_at: string | null
          weekly_budget: number | null
          weight: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          auto_regenerate?: boolean | null
          avatar_url?: string | null
          bmr_cached?: number | null
          budget_preference?: string | null
          cooking_skill?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          diet_type?: string | null
          disliked_ingredients?: string[] | null
          display_name?: string | null
          email: string
          fitness_goal?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          height_cm?: number | null
          id: string
          intolerances?: string[] | null
          kitchen_equipment?: string[] | null
          onboarding_complete?: boolean | null
          preferences?: Json | null
          region?: string | null
          subscription_tier?: string | null
          target_weight_kg?: number | null
          tdee_cached?: number | null
          updated_at?: string | null
          weekly_budget?: number | null
          weight?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          auto_regenerate?: boolean | null
          avatar_url?: string | null
          bmr_cached?: number | null
          budget_preference?: string | null
          cooking_skill?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          diet_type?: string | null
          disliked_ingredients?: string[] | null
          display_name?: string | null
          email?: string
          fitness_goal?: string | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          height_cm?: number | null
          id?: string
          intolerances?: string[] | null
          kitchen_equipment?: string[] | null
          onboarding_complete?: boolean | null
          preferences?: Json | null
          region?: string | null
          subscription_tier?: string | null
          target_weight_kg?: number | null
          tdee_cached?: number | null
          updated_at?: string | null
          weekly_budget?: number | null
          weight?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          body_fat_pct: number | null
          calories_consumed: number | null
          carbs_g: number | null
          date: string
          fats_g: number | null
          id: string
          mood: string | null
          notes: string | null
          protein_g: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          calories_consumed?: number | null
          carbs_g?: number | null
          date: string
          fats_g?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          protein_g?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          calories_consumed?: number | null
          carbs_g?: number | null
          date?: string
          fats_g?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          protein_g?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          recipe_id: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_likes: {
        Row: {
          created_at: string | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_likes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string | null
          author_name: string | null
          avg_rating: number | null
          calories: number
          carbs_g: number
          category: string
          comments_count: number | null
          cook_time_min: number | null
          cost_estimate: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          diet_tags: string[]
          equipment_needed: string[] | null
          fats_g: number
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string
          is_community: boolean | null
          likes_count: number | null
          prep_time_min: number | null
          protein_g: number
          rating_count: number | null
          skill_level: string | null
          title: string
          tutorial_steps: Json | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          avg_rating?: number | null
          calories: number
          carbs_g: number
          category: string
          comments_count?: number | null
          cook_time_min?: number | null
          cost_estimate?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_tags?: string[]
          equipment_needed?: string[] | null
          fats_g: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string
          is_community?: boolean | null
          likes_count?: number | null
          prep_time_min?: number | null
          protein_g: number
          rating_count?: number | null
          skill_level?: string | null
          title: string
          tutorial_steps?: Json | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          avg_rating?: number | null
          calories?: number
          carbs_g?: number
          category?: string
          comments_count?: number | null
          cook_time_min?: number | null
          cost_estimate?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_tags?: string[]
          equipment_needed?: string[] | null
          fats_g?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string
          is_community?: boolean | null
          likes_count?: number | null
          prep_time_min?: number | null
          protein_g?: number
          rating_count?: number | null
          skill_level?: string | null
          title?: string
          tutorial_steps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          actual_price_eur: number | null
          category: string | null
          estimated_price_eur: number | null
          id: string
          ingredient_name: string
          is_checked: boolean | null
          quantity: number | null
          shopping_list_id: string
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          actual_price_eur?: number | null
          category?: string | null
          estimated_price_eur?: number | null
          id?: string
          ingredient_name: string
          is_checked?: boolean | null
          quantity?: number | null
          shopping_list_id: string
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          actual_price_eur?: number | null
          category?: string | null
          estimated_price_eur?: number | null
          id?: string
          ingredient_name?: string
          is_checked?: boolean | null
          quantity?: number | null
          shopping_list_id?: string
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          id: string
          meal_plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      coach_conversations: {
        Row: {
          created_at: string | null
          id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string | null
          role: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          role?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_coach_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_calculate_bmr: {
        Args: {
          p_age: number
          p_gender: string
          p_height_cm: number
          p_weight_kg: number
        }
        Returns: number
      }
      fn_is_premium: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
