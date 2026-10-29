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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_page_views: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          page_path: string | null
          page_title: string | null
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          page_title?: string | null
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          page_title?: string | null
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_theme_preferences: {
        Row: {
          accent_color: string | null
          contrast: number | null
          created_at: string
          id: string
          saturation: number | null
          sidebar_style: string | null
          theme_preset: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          contrast?: number | null
          created_at?: string
          id?: string
          saturation?: number | null
          sidebar_style?: string | null
          theme_preset?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          contrast?: number | null
          created_at?: string
          id?: string
          saturation?: number | null
          sidebar_style?: string | null
          theme_preset?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      alpha_digital_leads: {
        Row: {
          archived_at: string | null
          company: string | null
          created_at: string
          email: string | null
          enrichment_excluded_at: string | null
          enrichment_excluded_reason: string | null
          external_id: string | null
          ghl_contact_id: string | null
          ghl_opportunity_id: string | null
          ghl_push_meta: Json | null
          ghl_pushed_at: string | null
          id: string
          name: string | null
          phone: string | null
          raw_data: Json | null
          source: string | null
          status: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          enrichment_excluded_at?: string | null
          enrichment_excluded_reason?: string | null
          external_id?: string | null
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          ghl_push_meta?: Json | null
          ghl_pushed_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          enrichment_excluded_at?: string | null
          enrichment_excluded_reason?: string | null
          external_id?: string | null
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          ghl_push_meta?: Json | null
          ghl_pushed_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_api_alert_config: {
        Row: {
          cooldown_minutes: number
          enabled: boolean
          id: number
          recipient: string
          threshold: number
          updated_at: string
          updated_by: string | null
          window_minutes: number
        }
        Insert: {
          cooldown_minutes?: number
          enabled?: boolean
          id?: number
          recipient?: string
          threshold?: number
          updated_at?: string
          updated_by?: string | null
          window_minutes?: number
        }
        Update: {
          cooldown_minutes?: number
          enabled?: boolean
          id?: number
          recipient?: string
          threshold?: number
          updated_at?: string
          updated_by?: string | null
          window_minutes?: number
        }
        Relationships: []
      }
      blog_api_alerts: {
        Row: {
          error_count: number
          error_message: string | null
          id: string
          recipient: string
          sample_errors: Json | null
          sent_at: string
          status: string
          threshold: number
          window_minutes: number
        }
        Insert: {
          error_count: number
          error_message?: string | null
          id?: string
          recipient: string
          sample_errors?: Json | null
          sent_at?: string
          status?: string
          threshold: number
          window_minutes: number
        }
        Update: {
          error_count?: number
          error_message?: string | null
          id?: string
          recipient?: string
          sample_errors?: Json | null
          sent_at?: string
          status?: string
          threshold?: number
          window_minutes?: number
        }
        Relationships: []
      }
      blog_api_log: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          ip: string | null
          payload_preview: Json | null
          slug: string | null
          status_code: number
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          ip?: string | null
          payload_preview?: Json | null
          slug?: string | null
          status_code: number
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          ip?: string | null
          payload_preview?: Json | null
          slug?: string | null
          status_code?: number
          success?: boolean
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          source: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_views: {
        Row: {
          blog_id: string
          id: string
          ip_hash: string | null
          viewed_at: string
          visitor_id: string | null
        }
        Insert: {
          blog_id: string
          id?: string
          ip_hash?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Update: {
          blog_id?: string
          id?: string
          ip_hash?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_views_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      build_findings: {
        Row: {
          area: string
          created_at: string
          found_on: string
          id: string
          is_doc_error: boolean
          phase: string | null
          resolution: string | null
          state: string
          title: string
          updated_at: string
          what_broke: string
        }
        Insert: {
          area: string
          created_at?: string
          found_on?: string
          id?: string
          is_doc_error?: boolean
          phase?: string | null
          resolution?: string | null
          state?: string
          title: string
          updated_at?: string
          what_broke: string
        }
        Update: {
          area?: string
          created_at?: string
          found_on?: string
          id?: string
          is_doc_error?: boolean
          phase?: string | null
          resolution?: string | null
          state?: string
          title?: string
          updated_at?: string
          what_broke?: string
        }
        Relationships: []
      }
      cron_http_log: {
        Row: {
          created_at: string
          id: number
          jobname: string
          request_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          jobname: string
          request_id: number
        }
        Update: {
          created_at?: string
          id?: number
          jobname?: string
          request_id?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          approval_note: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          client_name: string
          commission_eligible_at: string | null
          commission_status: string
          contact_email: string
          conversation_confirmed: boolean
          created_at: string
          description: string | null
          evidence_urls: string[]
          id: string
          manual_override: boolean
          monthly_fee: number
          override_by: string | null
          override_note: string | null
          partner_id: string
          payment_cleared: boolean
          payment_cleared_at: string | null
          payment_status: string
          setup_fee: number
          status: string
          stripe_payment_intent_id: string | null
          territory: string
          updated_at: string
        }
        Insert: {
          approval_note?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          client_name: string
          commission_eligible_at?: string | null
          commission_status?: string
          contact_email: string
          conversation_confirmed?: boolean
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          manual_override?: boolean
          monthly_fee?: number
          override_by?: string | null
          override_note?: string | null
          partner_id: string
          payment_cleared?: boolean
          payment_cleared_at?: string | null
          payment_status?: string
          setup_fee?: number
          status?: string
          stripe_payment_intent_id?: string | null
          territory?: string
          updated_at?: string
        }
        Update: {
          approval_note?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          client_name?: string
          commission_eligible_at?: string | null
          commission_status?: string
          contact_email?: string
          conversation_confirmed?: boolean
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          manual_override?: boolean
          monthly_fee?: number
          override_by?: string | null
          override_note?: string | null
          partner_id?: string
          payment_cleared?: boolean
          payment_cleared_at?: string | null
          payment_status?: string
          setup_fee?: number
          status?: string
          stripe_payment_intent_id?: string | null
          territory?: string
          updated_at?: string
        }
        Relationships: []
      }
      demo_engagement: {
        Row: {
          created_at: string | null
          demo_id: string
          device_type: string | null
          duration_seconds: number | null
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          referrer: string | null
          session_id: string | null
          step_id: string | null
          step_number: number | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          demo_id: string
          device_type?: string | null
          duration_seconds?: number | null
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          step_id?: string | null
          step_number?: number | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          demo_id?: string
          device_type?: string | null
          duration_seconds?: number | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          step_id?: string | null
          step_number?: number | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      diy_access_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentation: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          id: string
          parent_id: string | null
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          parent_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          parent_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounce_reason: string | null
          bounce_type: string | null
          bounced_at: string | null
          click_count: number | null
          clicked_at: string | null
          delivery_status: string | null
          error_message: string | null
          function_name: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          opened_at: string | null
          opened_count: number | null
          recipient_email: string
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          template_key: string
          user_agent: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          opened_at?: string | null
          opened_count?: number | null
          recipient_email: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          template_key: string
          user_agent?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          opened_at?: string | null
          opened_count?: number | null
          recipient_email?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          template_key?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          bounce_message: string | null
          bounce_type: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          reason: string
          source_log_id: string | null
          suppressed_at: string
        }
        Insert: {
          bounce_message?: string | null
          bounce_type?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          reason: string
          source_log_id?: string | null
          suppressed_at?: string
        }
        Update: {
          bounce_message?: string | null
          bounce_type?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          reason?: string
          source_log_id?: string | null
          suppressed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_suppressions_source_log_id_fkey"
            columns: ["source_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          body_bg_color: string | null
          body_text: string
          button_bg_end: string | null
          button_bg_start: string | null
          button_text: string | null
          button_text_color: string | null
          created_at: string
          created_by: string | null
          custom_html: string | null
          footer_bg_color: string | null
          footer_text: string | null
          header_bg_end: string | null
          header_bg_start: string | null
          heading: string
          heading_color: string | null
          id: string
          subject: string
          template_id: string
          template_key: string
          text_color: string | null
          use_custom_html: boolean
          version_number: number
        }
        Insert: {
          body_bg_color?: string | null
          body_text: string
          button_bg_end?: string | null
          button_bg_start?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_html?: string | null
          footer_bg_color?: string | null
          footer_text?: string | null
          header_bg_end?: string | null
          header_bg_start?: string | null
          heading: string
          heading_color?: string | null
          id?: string
          subject: string
          template_id: string
          template_key: string
          text_color?: string | null
          use_custom_html?: boolean
          version_number: number
        }
        Update: {
          body_bg_color?: string | null
          body_text?: string
          button_bg_end?: string | null
          button_bg_start?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_html?: string | null
          footer_bg_color?: string | null
          footer_text?: string | null
          header_bg_end?: string | null
          header_bg_start?: string | null
          heading?: string
          heading_color?: string | null
          id?: string
          subject?: string
          template_id?: string
          template_key?: string
          text_color?: string | null
          use_custom_html?: boolean
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_bg_color: string | null
          body_text: string
          button_bg_end: string | null
          button_bg_start: string | null
          button_text: string | null
          button_text_color: string | null
          custom_html: string | null
          footer_bg_color: string | null
          footer_text: string | null
          header_bg_end: string | null
          header_bg_start: string | null
          heading: string
          heading_color: string | null
          id: string
          subject: string
          template_key: string
          text_color: string | null
          updated_at: string
          updated_by: string | null
          use_custom_html: boolean
        }
        Insert: {
          body_bg_color?: string | null
          body_text: string
          button_bg_end?: string | null
          button_bg_start?: string | null
          button_text?: string | null
          button_text_color?: string | null
          custom_html?: string | null
          footer_bg_color?: string | null
          footer_text?: string | null
          header_bg_end?: string | null
          header_bg_start?: string | null
          heading: string
          heading_color?: string | null
          id?: string
          subject: string
          template_key: string
          text_color?: string | null
          updated_at?: string
          updated_by?: string | null
          use_custom_html?: boolean
        }
        Update: {
          body_bg_color?: string | null
          body_text?: string
          button_bg_end?: string | null
          button_bg_start?: string | null
          button_text?: string | null
          button_text_color?: string | null
          custom_html?: string | null
          footer_bg_color?: string | null
          footer_text?: string | null
          header_bg_end?: string | null
          header_bg_start?: string | null
          heading?: string
          heading_color?: string | null
          id?: string
          subject?: string
          template_key?: string
          text_color?: string | null
          updated_at?: string
          updated_by?: string | null
          use_custom_html?: boolean
        }
        Relationships: []
      }
      email_tracking_tokens: {
        Row: {
          created_at: string
          first_triggered_at: string | null
          id: string
          log_id: string
          target_url: string | null
          token: string
          tracking_type: string
          trigger_count: number | null
        }
        Insert: {
          created_at?: string
          first_triggered_at?: string | null
          id?: string
          log_id: string
          target_url?: string | null
          token: string
          tracking_type: string
          trigger_count?: number | null
        }
        Update: {
          created_at?: string
          first_triggered_at?: string | null
          id?: string
          log_id?: string
          target_url?: string | null
          token?: string
          tracking_type?: string
          trigger_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_tokens_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          email: string
          event_id: string
          id: string
          name: string | null
          registered_at: string
          reminder_sent_at: string | null
        }
        Insert: {
          email: string
          event_id: string
          id?: string
          name?: string | null
          registered_at?: string
          reminder_sent_at?: string | null
        }
        Update: {
          email?: string
          event_id?: string
          id?: string
          name?: string | null
          registered_at?: string
          reminder_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "webinars_events"
            referencedColumns: ["id"]
          },
        ]
      }
      export_requests: {
        Row: {
          created_at: string
          export_description: string | null
          export_type: string
          filters_applied: Json | null
          id: string
          requested_by: string
          requested_by_email: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_email: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          export_description?: string | null
          export_type: string
          filters_applied?: Json | null
          id?: string
          requested_by: string
          requested_by_email: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          export_description?: string | null
          export_type?: string
          filters_applied?: Json | null
          id?: string
          requested_by?: string
          requested_by_email?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_engagement: {
        Row: {
          created_at: string
          faq_group: string | null
          faq_question: string
          faq_slug: string
          id: string
          medium: string | null
          page_path: string
          session_id: string | null
          source: string | null
          user_agent: string | null
          visitor_email: string | null
        }
        Insert: {
          created_at?: string
          faq_group?: string | null
          faq_question: string
          faq_slug: string
          id?: string
          medium?: string | null
          page_path: string
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          visitor_email?: string | null
        }
        Update: {
          created_at?: string
          faq_group?: string | null
          faq_question?: string
          faq_slug?: string
          id?: string
          medium?: string | null
          page_path?: string
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
          visitor_email?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          author_id: string | null
          category: string | null
          created_at: string
          id: string
          published_at: string | null
          question: string
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          answer: string
          author_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          question: string
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          answer?: string
          author_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          question?: string
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_key: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ghl_submissions: {
        Row: {
          archived_at: string | null
          assigned_distributor_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          ghl_opportunity_id: string | null
          ghl_response: Json | null
          ghl_status: string | null
          id: string
          lead_company: string | null
          lead_email: string
          lead_first_name: string | null
          lead_last_name: string | null
          lead_name: string | null
          lead_phone: string | null
          lead_source: string | null
          meet_link: string | null
          meeting_category: string | null
          pipeline_id: string | null
          pipeline_name: string | null
          pipeline_stage_id: string | null
          pipeline_stage_name: string | null
          source_campaign: string | null
          source_medium: string
          source_page: string
          visitor_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_distributor_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          ghl_opportunity_id?: string | null
          ghl_response?: Json | null
          ghl_status?: string | null
          id?: string
          lead_company?: string | null
          lead_email: string
          lead_first_name?: string | null
          lead_last_name?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_source?: string | null
          meet_link?: string | null
          meeting_category?: string | null
          pipeline_id?: string | null
          pipeline_name?: string | null
          pipeline_stage_id?: string | null
          pipeline_stage_name?: string | null
          source_campaign?: string | null
          source_medium: string
          source_page: string
          visitor_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_distributor_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          ghl_opportunity_id?: string | null
          ghl_response?: Json | null
          ghl_status?: string | null
          id?: string
          lead_company?: string | null
          lead_email?: string
          lead_first_name?: string | null
          lead_last_name?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_source?: string | null
          meet_link?: string | null
          meeting_category?: string | null
          pipeline_id?: string | null
          pipeline_name?: string | null
          pipeline_stage_id?: string | null
          pipeline_stage_name?: string | null
          source_campaign?: string | null
          source_medium?: string
          source_page?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      ghl_sync_history: {
        Row: {
          created_at: string
          error_message: string | null
          ghl_contact_id: string | null
          ghl_response: Json | null
          id: string
          lead_email: string
          submission_id: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          ghl_contact_id?: string | null
          ghl_response?: Json | null
          id?: string
          lead_email: string
          submission_id?: string | null
          sync_status: string
          sync_type?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          ghl_contact_id?: string | null
          ghl_response?: Json | null
          id?: string
          lead_email?: string
          submission_id?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghl_sync_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "faq_engagement_funnel"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "ghl_sync_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "ghl_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      guides_playbooks: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_read_time: number | null
          featured_image_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean
          is_gated: boolean | null
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          is_gated?: boolean | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_read_time?: number | null
          featured_image_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          is_gated?: boolean | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      handover_requests: {
        Row: {
          assigned_distributor_id: string | null
          assigned_to: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by_user_id: string | null
          id: string
          monthly_retainer_max: number | null
          monthly_retainer_min: number | null
          notes: string | null
          priority: string | null
          quote_id: string
          setup_fee_max: number | null
          setup_fee_min: number | null
          status: string | null
          updated_at: string | null
          workflows: Json | null
        }
        Insert: {
          assigned_distributor_id?: string | null
          assigned_to?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          priority?: string | null
          quote_id: string
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          status?: string | null
          updated_at?: string | null
          workflows?: Json | null
        }
        Update: {
          assigned_distributor_id?: string | null
          assigned_to?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          priority?: string | null
          quote_id?: string
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          status?: string | null
          updated_at?: string | null
          workflows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_requests_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_bookings: {
        Row: {
          calendly_event_id: string | null
          calendly_invitee_id: string | null
          cancellation_reason: string | null
          created_at: string
          end_time: string | null
          event_name: string | null
          event_type: string | null
          id: string
          investor_id: string | null
          location: string | null
          rescheduled_from: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          calendly_event_id?: string | null
          calendly_invitee_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          investor_id?: string | null
          location?: string | null
          rescheduled_from?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          calendly_event_id?: string | null
          calendly_invitee_id?: string | null
          cancellation_reason?: string | null
          created_at?: string
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          investor_id?: string | null
          location?: string | null
          rescheduled_from?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_bookings_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_bookings_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "investor_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_code_usage: {
        Row: {
          access_code: string
          accessed_at: string
          id: string
          investor_id: string | null
          ip_address: string | null
          is_master_code: boolean | null
          user_agent: string | null
        }
        Insert: {
          access_code: string
          accessed_at?: string
          id?: string
          investor_id?: string | null
          ip_address?: string | null
          is_master_code?: boolean | null
          user_agent?: string | null
        }
        Update: {
          access_code?: string
          accessed_at?: string
          id?: string
          investor_id?: string | null
          ip_address?: string | null
          is_master_code?: boolean | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_code_usage_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_leads: {
        Row: {
          access_code: string | null
          access_code_expires_at: string | null
          admin_notes: string | null
          created_at: string
          email: string
          firm_name: string
          full_name: string
          how_heard_about: string | null
          id: string
          interest_reason: string | null
          investment_focus: string | null
          ip_address: string | null
          linkedin_url: string | null
          phone_number: string | null
          phone_verified: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          session_token: string | null
          social_profile_url: string | null
          status: Database["public"]["Enums"]["investor_lead_status"]
          typical_check_size: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          access_code?: string | null
          access_code_expires_at?: string | null
          admin_notes?: string | null
          created_at?: string
          email: string
          firm_name: string
          full_name: string
          how_heard_about?: string | null
          id?: string
          interest_reason?: string | null
          investment_focus?: string | null
          ip_address?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          session_token?: string | null
          social_profile_url?: string | null
          status?: Database["public"]["Enums"]["investor_lead_status"]
          typical_check_size?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          access_code?: string | null
          access_code_expires_at?: string | null
          admin_notes?: string | null
          created_at?: string
          email?: string
          firm_name?: string
          full_name?: string
          how_heard_about?: string | null
          id?: string
          interest_reason?: string | null
          investment_focus?: string | null
          ip_address?: string | null
          linkedin_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          session_token?: string | null
          social_profile_url?: string | null
          status?: Database["public"]["Enums"]["investor_lead_status"]
          typical_check_size?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      investor_page_views: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          investor_id: string | null
          ip_address: string | null
          metadata: Json | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          id?: string
          investor_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          investor_id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_page_views_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          areas_of_interest: string[] | null
          cover_letter: string | null
          created_at: string | null
          email: string
          id: string
          is_general_application: boolean | null
          job_id: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          areas_of_interest?: string[] | null
          cover_letter?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_general_application?: boolean | null
          job_id?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_of_interest?: string[] | null
          cover_letter?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_general_application?: boolean | null
          job_id?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          application_url: string | null
          author_id: string | null
          created_at: string | null
          department: string
          description: string | null
          employment_type: string | null
          id: string
          is_featured: boolean | null
          is_remote: boolean | null
          location: string
          published_at: string | null
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_url?: string | null
          author_id?: string | null
          created_at?: string | null
          department: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location: string
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_url?: string | null
          author_id?: string | null
          created_at?: string | null
          department?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          is_featured?: boolean | null
          is_remote?: boolean | null
          location?: string
          published_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      keyword_metrics_snapshots: {
        Row: {
          clicks: number
          conversions: number
          created_at: string
          ctr: number
          id: string
          impressions: number
          keyword_id: string
          metric_date: string
          position: number | null
          top_landing_path: string | null
        }
        Insert: {
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          keyword_id: string
          metric_date: string
          position?: number | null
          top_landing_path?: string | null
        }
        Update: {
          clicks?: number
          conversions?: number
          created_at?: string
          ctr?: number
          id?: string
          impressions?: number
          keyword_id?: string
          metric_date?: string
          position?: number | null
          top_landing_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_metrics_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "tracked_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_alert_log: {
        Row: {
          alert_type: string
          alerted_at: string
          id: string
          lead_id: string
          lead_source: string
        }
        Insert: {
          alert_type?: string
          alerted_at?: string
          id?: string
          lead_id: string
          lead_source: string
        }
        Update: {
          alert_type?: string
          alerted_at?: string
          id?: string
          lead_id?: string
          lead_source?: string
        }
        Relationships: []
      }
      lead_annotations: {
        Row: {
          id: string
          lead_id: string
          lead_source: string
          outcome: string | null
          owner_id: string | null
          owner_source: string | null
          stage: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          lead_source: string
          outcome?: string | null
          owner_id?: string | null
          owner_source?: string | null
          stage?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          lead_source?: string
          outcome?: string | null
          owner_id?: string | null
          owner_source?: string | null
          stage?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_annotations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_followers: {
        Row: {
          created_at: string
          follower_id: string
          id: string
          lead_id: string
          lead_source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          id?: string
          lead_id: string
          lead_source: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          id?: string
          lead_id?: string
          lead_source?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_merges: {
        Row: {
          created_at: string
          id: string
          matched_on: string
          merged_by: string | null
          merged_id: string
          merged_source: string
          primary_id: string
          primary_source: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          matched_on?: string
          merged_by?: string | null
          merged_id: string
          merged_source: string
          primary_id: string
          primary_source: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          matched_on?: string
          merged_by?: string | null
          merged_id?: string
          merged_source?: string
          primary_id?: string
          primary_source?: string
          reason?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
          lead_source: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
          lead_source: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          lead_source?: string
        }
        Relationships: []
      }
      lead_segments: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          archived_at: string | null
          assigned_distributor_id: string | null
          company: string | null
          created_at: string
          created_by_user_id: string | null
          email: string
          first_name: string
          ghl_response: Json | null
          id: string
          job_title: string | null
          last_name: string
          lead_source: string | null
          lead_type: string
          message: string | null
          notification_error: string | null
          notification_sent_at: string | null
          notification_status: string | null
          phone: string | null
          source_campaign: string | null
          source_medium: string | null
          source_page: string | null
          visitor_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_distributor_id?: string | null
          company?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email: string
          first_name: string
          ghl_response?: Json | null
          id?: string
          job_title?: string | null
          last_name: string
          lead_source?: string | null
          lead_type?: string
          message?: string | null
          notification_error?: string | null
          notification_sent_at?: string | null
          notification_status?: string | null
          phone?: string | null
          source_campaign?: string | null
          source_medium?: string | null
          source_page?: string | null
          visitor_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_distributor_id?: string | null
          company?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string
          first_name?: string
          ghl_response?: Json | null
          id?: string
          job_title?: string | null
          last_name?: string
          lead_source?: string | null
          lead_type?: string
          message?: string | null
          notification_error?: string | null
          notification_sent_at?: string | null
          notification_status?: string | null
          phone?: string | null
          source_campaign?: string | null
          source_medium?: string | null
          source_page?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      meeting_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size_bytes: number | null
          file_url: string
          ghl_sync_response: Json | null
          ghl_synced: boolean | null
          ghl_synced_at: string | null
          id: string
          meeting_category: string | null
          meeting_id: string | null
          meeting_type: string
          metadata: Json | null
          mime_type: string | null
          source: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          ghl_sync_response?: Json | null
          ghl_synced?: boolean | null
          ghl_synced_at?: string | null
          id?: string
          meeting_category?: string | null
          meeting_id?: string | null
          meeting_type: string
          metadata?: Json | null
          mime_type?: string | null
          source: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          ghl_sync_response?: Json | null
          ghl_synced?: boolean | null
          ghl_synced_at?: string | null
          id?: string
          meeting_category?: string | null
          meeting_id?: string | null
          meeting_type?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      meeting_history: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          meeting_id: string
          meeting_type: string
          new_status: string
          notes: string | null
          previous_status: string | null
          webhook_payload: Json | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          meeting_id: string
          meeting_type: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          meeting_id?: string
          meeting_type?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
          webhook_payload?: Json | null
        }
        Relationships: []
      }
      meta_leads: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          campaign_id: string | null
          client: string | null
          created_at: string
          email: string | null
          form_id: string | null
          form_name: string | null
          full_name: string | null
          ghl_contact_id: string | null
          id: string
          leadgen_id: string | null
          notification_error: string | null
          notification_sent_at: string | null
          notification_status: string | null
          phone: string | null
          raw_payload: Json | null
          source: string | null
          status: string
          submitted_at: string | null
          tags: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          campaign_id?: string | null
          client?: string | null
          created_at?: string
          email?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          ghl_contact_id?: string | null
          id?: string
          leadgen_id?: string | null
          notification_error?: string | null
          notification_sent_at?: string | null
          notification_status?: string | null
          phone?: string | null
          raw_payload?: Json | null
          source?: string | null
          status?: string
          submitted_at?: string | null
          tags?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          campaign_id?: string | null
          client?: string | null
          created_at?: string
          email?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          ghl_contact_id?: string | null
          id?: string
          leadgen_id?: string | null
          notification_error?: string | null
          notification_sent_at?: string | null
          notification_status?: string | null
          phone?: string | null
          raw_payload?: Json | null
          source?: string | null
          status?: string
          submitted_at?: string | null
          tags?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          company: string | null
          email: string
          id: string
          ip_address: string | null
          is_active: boolean
          name: string | null
          phone: string | null
          resubscribed_at: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          email: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          resubscribed_at?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          resubscribed_at?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      page_engagement: {
        Row: {
          bounced: boolean
          device: string | null
          engaged: boolean
          exit_section: string | null
          id: string
          is_bot: boolean
          landed_at: string
          last_active_at: string
          max_scroll_pct: number
          path: string
          primary_cta_clicks: Json
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_email: string | null
        }
        Insert: {
          bounced?: boolean
          device?: string | null
          engaged?: boolean
          exit_section?: string | null
          id?: string
          is_bot?: boolean
          landed_at?: string
          last_active_at?: string
          max_scroll_pct?: number
          path: string
          primary_cta_clicks?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_email?: string | null
        }
        Update: {
          bounced?: boolean
          device?: string | null
          engaged?: boolean
          exit_section?: string | null
          id?: string
          is_bot?: boolean
          landed_at?: string
          last_active_at?: string
          max_scroll_pct?: number
          path?: string
          primary_cta_clicks?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_email?: string | null
        }
        Relationships: []
      }
      partner_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_name: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      partner_agreement_signatures: {
        Row: {
          agreement_version: string | null
          created_at: string
          id: string
          partner_abn: string | null
          partner_address: string | null
          partner_legal_name: string
          signatory_name: string
          signatory_title: string | null
          signature_text: string
          signed_at: string
          territory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreement_version?: string | null
          created_at?: string
          id?: string
          partner_abn?: string | null
          partner_address?: string | null
          partner_legal_name: string
          signatory_name: string
          signatory_title?: string | null
          signature_text: string
          signed_at?: string
          territory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreement_version?: string | null
          created_at?: string
          id?: string
          partner_abn?: string | null
          partner_address?: string | null
          partner_legal_name?: string
          signatory_name?: string
          signatory_title?: string | null
          signature_text?: string
          signed_at?: string
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          territory: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          territory?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          territory?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "partner_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_chat_sessions: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          ip_hash: string | null
          last_message_at: string
          lead_company: string | null
          lead_email: string
          lead_name: string
          partner_type: string
          session_token: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string
          lead_company?: string | null
          lead_email: string
          lead_name: string
          partner_type: string
          session_token?: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string
          lead_company?: string | null
          lead_email?: string
          lead_name?: string
          partner_type?: string
          session_token?: string
        }
        Relationships: []
      }
      partner_payout_details: {
        Row: {
          abn: string | null
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          bsb: string | null
          country: string
          created_at: string
          gst_registered: boolean
          id: string
          notes: string | null
          payout_email: string | null
          payout_method: string
          swift_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          bsb?: string | null
          country?: string
          created_at?: string
          gst_registered?: boolean
          id?: string
          notes?: string | null
          payout_email?: string | null
          payout_method?: string
          swift_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abn?: string | null
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          bsb?: string | null
          country?: string
          created_at?: string
          gst_registered?: boolean
          id?: string
          notes?: string | null
          payout_email?: string | null
          payout_method?: string
          swift_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          contact_email: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean
          is_approved: boolean
          last_onboarding_reminder_at: string | null
          must_change_password: boolean
          onboarding: Json
          phone: string | null
          territory: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          contact_email?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          last_onboarding_reminder_at?: string | null
          must_change_password?: boolean
          onboarding?: Json
          phone?: string | null
          territory?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          contact_email?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          last_onboarding_reminder_at?: string | null
          must_change_password?: boolean
          onboarding?: Json
          phone?: string | null
          territory?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          invited_by_email: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_by_email: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_by_email?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string
          device_type: string | null
          id: string
          metric_name: string
          metric_value: number
          page_url: string
          rating: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name: string
          metric_value: number
          page_url: string
          rating?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          page_url?: string
          rating?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      platform_updates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          published_at: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          published_at?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      proposal_pdf_downloads: {
        Row: {
          downloaded_at: string
          downloaded_by: string | null
          downloaded_by_email: string | null
          id: string
          ip_address: string | null
          quote_id: string
          user_agent: string | null
        }
        Insert: {
          downloaded_at?: string
          downloaded_by?: string | null
          downloaded_by_email?: string | null
          id?: string
          ip_address?: string | null
          quote_id: string
          user_agent?: string | null
        }
        Update: {
          downloaded_at?: string
          downloaded_by?: string | null
          downloaded_by_email?: string | null
          id?: string
          ip_address?: string | null
          quote_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      proposal_signatures: {
        Row: {
          id: string
          quote_id: string
          session_id: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string
          signer_email: string
          signer_ip_hash: string | null
          signer_name: string
          terms_accepted: boolean
          user_agent: string | null
        }
        Insert: {
          id?: string
          quote_id: string
          session_id?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string
          signer_email: string
          signer_ip_hash?: string | null
          signer_name: string
          terms_accepted?: boolean
          user_agent?: string | null
        }
        Update: {
          id?: string
          quote_id?: string
          session_id?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string
          signer_email?: string
          signer_ip_hash?: string | null
          signer_name?: string
          terms_accepted?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_signatures_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_views: {
        Row: {
          device_type: string | null
          id: string
          ip_hash: string | null
          is_admin_view: boolean
          is_first_view: boolean | null
          quote_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_admin_view?: boolean
          is_first_view?: boolean | null
          quote_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          device_type?: string | null
          id?: string
          ip_hash?: string | null
          is_admin_view?: boolean
          is_first_view?: boolean | null
          quote_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          quote_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          quote_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          quote_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_notes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_payments: {
        Row: {
          amount: number
          clicked_at: string | null
          client_confirmed_at: string | null
          company_name: string | null
          completed_at: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          installment_number: number | null
          installment_type: string | null
          payment_link_url: string | null
          payment_type: string
          pricing_option: string | null
          quote_id: string
          receipt_number: string | null
          receipt_url: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          clicked_at?: string | null
          client_confirmed_at?: string | null
          company_name?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          installment_number?: number | null
          installment_type?: string | null
          payment_link_url?: string | null
          payment_type: string
          pricing_option?: string | null
          quote_id: string
          receipt_number?: string | null
          receipt_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          clicked_at?: string | null
          client_confirmed_at?: string | null
          company_name?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          installment_number?: number | null
          installment_type?: string | null
          payment_link_url?: string | null
          payment_type?: string
          pricing_option?: string | null
          quote_id?: string
          receipt_number?: string | null
          receipt_url?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      quote_versions: {
        Row: {
          challenges: string[] | null
          change_summary: string | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contract_months: number | null
          created_at: string
          created_by: string | null
          current_tech_stack: Json | null
          id: string
          industry: string | null
          meeting_transcript: string | null
          monthly_retainer_final: number | null
          monthly_retainer_max: number | null
          monthly_retainer_min: number | null
          notes: string | null
          quote_id: string
          roi_best: number | null
          roi_conservative: number | null
          roi_likely: number | null
          sentiment_analysis: Json | null
          setup_fee_final: number | null
          setup_fee_max: number | null
          setup_fee_min: number | null
          team_size: number | null
          timeline: string | null
          transcript_summary: string | null
          version_number: number
          voice_agent_monthly_cost: number | null
          voice_agent_plan: string | null
          voice_agent_setup_cost: number | null
          voice_agent_workflow_count: number | null
          workflows: Json | null
        }
        Insert: {
          challenges?: string[] | null
          change_summary?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contract_months?: number | null
          created_at?: string
          created_by?: string | null
          current_tech_stack?: Json | null
          id?: string
          industry?: string | null
          meeting_transcript?: string | null
          monthly_retainer_final?: number | null
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          quote_id: string
          roi_best?: number | null
          roi_conservative?: number | null
          roi_likely?: number | null
          sentiment_analysis?: Json | null
          setup_fee_final?: number | null
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          team_size?: number | null
          timeline?: string | null
          transcript_summary?: string | null
          version_number?: number
          voice_agent_monthly_cost?: number | null
          voice_agent_plan?: string | null
          voice_agent_setup_cost?: number | null
          voice_agent_workflow_count?: number | null
          workflows?: Json | null
        }
        Update: {
          challenges?: string[] | null
          change_summary?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contract_months?: number | null
          created_at?: string
          created_by?: string | null
          current_tech_stack?: Json | null
          id?: string
          industry?: string | null
          meeting_transcript?: string | null
          monthly_retainer_final?: number | null
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          quote_id?: string
          roi_best?: number | null
          roi_conservative?: number | null
          roi_likely?: number | null
          sentiment_analysis?: Json | null
          setup_fee_final?: number | null
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          team_size?: number | null
          timeline?: string | null
          transcript_summary?: string | null
          version_number?: number
          voice_agent_monthly_cost?: number | null
          voice_agent_plan?: string | null
          voice_agent_setup_cost?: number | null
          voice_agent_workflow_count?: number | null
          workflows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          access_code: string | null
          assigned_distributor_id: string | null
          bundle_pricing: boolean
          challenges: string[] | null
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contract_months: number | null
          created_at: string
          created_by: string | null
          created_by_user_id: string | null
          current_tech_stack: Json | null
          handover_notes: string | null
          handover_status: string | null
          handover_triggered_at: string | null
          id: string
          industry: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          meeting_transcript: string | null
          monthly_retainer_final: number | null
          monthly_retainer_max: number | null
          monthly_retainer_min: number | null
          notes: string | null
          outcome: string | null
          payback_months_best: number | null
          payback_months_conservative: number | null
          payback_months_likely: number | null
          poc_requested: boolean
          pricing_option: string | null
          quote_id: string | null
          roi_best: number | null
          roi_conservative: number | null
          roi_likely: number | null
          sentiment_analysis: Json | null
          setup_fee_final: number | null
          setup_fee_max: number | null
          setup_fee_min: number | null
          signature_ip_hash: string | null
          signed_at: string | null
          signed_by_email: string | null
          signed_by_name: string | null
          status: string | null
          team_size: number | null
          timeline: string | null
          transcript_summary: string | null
          updated_at: string
          voice_agent_addons: Json | null
          voice_agent_monthly_cost: number | null
          voice_agent_plan: string | null
          voice_agent_setup_cost: number | null
          voice_agent_workflow_count: number | null
          workflows: Json | null
        }
        Insert: {
          access_code?: string | null
          assigned_distributor_id?: string | null
          bundle_pricing?: boolean
          challenges?: string[] | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contract_months?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          current_tech_stack?: Json | null
          handover_notes?: string | null
          handover_status?: string | null
          handover_triggered_at?: string | null
          id?: string
          industry?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          meeting_transcript?: string | null
          monthly_retainer_final?: number | null
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          outcome?: string | null
          payback_months_best?: number | null
          payback_months_conservative?: number | null
          payback_months_likely?: number | null
          poc_requested?: boolean
          pricing_option?: string | null
          quote_id?: string | null
          roi_best?: number | null
          roi_conservative?: number | null
          roi_likely?: number | null
          sentiment_analysis?: Json | null
          setup_fee_final?: number | null
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          signature_ip_hash?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          team_size?: number | null
          timeline?: string | null
          transcript_summary?: string | null
          updated_at?: string
          voice_agent_addons?: Json | null
          voice_agent_monthly_cost?: number | null
          voice_agent_plan?: string | null
          voice_agent_setup_cost?: number | null
          voice_agent_workflow_count?: number | null
          workflows?: Json | null
        }
        Update: {
          access_code?: string | null
          assigned_distributor_id?: string | null
          bundle_pricing?: boolean
          challenges?: string[] | null
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contract_months?: number | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          current_tech_stack?: Json | null
          handover_notes?: string | null
          handover_status?: string | null
          handover_triggered_at?: string | null
          id?: string
          industry?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          meeting_transcript?: string | null
          monthly_retainer_final?: number | null
          monthly_retainer_max?: number | null
          monthly_retainer_min?: number | null
          notes?: string | null
          outcome?: string | null
          payback_months_best?: number | null
          payback_months_conservative?: number | null
          payback_months_likely?: number | null
          poc_requested?: boolean
          pricing_option?: string | null
          quote_id?: string | null
          roi_best?: number | null
          roi_conservative?: number | null
          roi_likely?: number | null
          sentiment_analysis?: Json | null
          setup_fee_final?: number | null
          setup_fee_max?: number | null
          setup_fee_min?: number | null
          signature_ip_hash?: string | null
          signed_at?: string | null
          signed_by_email?: string | null
          signed_by_name?: string | null
          status?: string | null
          team_size?: number | null
          timeline?: string | null
          transcript_summary?: string | null
          updated_at?: string
          voice_agent_addons?: Json | null
          voice_agent_monthly_cost?: number | null
          voice_agent_plan?: string | null
          voice_agent_setup_cost?: number | null
          voice_agent_workflow_count?: number | null
          workflows?: Json | null
        }
        Relationships: []
      }
      record_collaborators: {
        Row: {
          added_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          ai_enhanced: boolean
          created_at: string
          device_type: string | null
          id: string
          query: string
          results_count: number
          selected_path: string | null
          selected_title: string | null
          session_id: string | null
          visitor_id: string | null
        }
        Insert: {
          ai_enhanced?: boolean
          created_at?: string
          device_type?: string | null
          id?: string
          query: string
          results_count?: number
          selected_path?: string | null
          selected_title?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          ai_enhanced?: boolean
          created_at?: string
          device_type?: string | null
          id?: string
          query?: string
          results_count?: number
          selected_path?: string | null
          selected_title?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      short_links: {
        Row: {
          blog_post_id: string | null
          click_count: number
          code: string
          content_id: string | null
          content_type: string | null
          created_at: string
          created_by: string | null
          destination_url: string
          id: string
          source_id: string | null
        }
        Insert: {
          blog_post_id?: string | null
          click_count?: number
          code: string
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          destination_url: string
          id?: string
          source_id?: string | null
        }
        Update: {
          blog_post_id?: string | null
          click_count?: number
          code?: string
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          destination_url?: string
          id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "short_links_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_id: string | null
          client_avatar_url: string | null
          client_company: string | null
          client_name: string
          client_title: string | null
          created_at: string
          headshot_key: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          published_at: string | null
          quote: string
          rating: number | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          client_avatar_url?: string | null
          client_company?: string | null
          client_name: string
          client_title?: string | null
          created_at?: string
          headshot_key?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          quote: string
          rating?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          client_avatar_url?: string | null
          client_company?: string | null
          client_name?: string
          client_title?: string | null
          created_at?: string
          headshot_key?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          quote?: string
          rating?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      tracked_keywords: {
        Row: {
          category: Database["public"]["Enums"]["keyword_category"]
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          notes: string | null
          search_market: string
          target_landing_path: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["keyword_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          notes?: string | null
          search_market?: string
          target_landing_path?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["keyword_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          notes?: string | null
          search_market?: string
          target_landing_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_google_connections: {
        Row: {
          access_token: string
          connected_at: string
          google_email: string
          google_name: string | null
          id: string
          refresh_token: string
          scopes: string[]
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          google_email: string
          google_name?: string | null
          id?: string
          refresh_token: string
          scopes?: string[]
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          google_email?: string
          google_name?: string | null
          id?: string
          refresh_token?: string
          scopes?: string[]
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          budget_range: string | null
          company: string | null
          created_at: string
          current_tools: string[] | null
          demos_completed: string[] | null
          demos_viewed: string[] | null
          email: string | null
          goals: string[] | null
          id: string
          industry: string | null
          last_accessed_at: string | null
          name: string | null
          pain_level: string | null
          pain_points: string[] | null
          personalization: Json | null
          primary_challenge: string | null
          recommended_demos: string[] | null
          roi_inputs: Json | null
          session_token: string | null
          source: string | null
          team_size: string | null
          timeline: string | null
          updated_at: string
          utm_params: Json | null
          workflows_to_automate: string[] | null
        }
        Insert: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          current_tools?: string[] | null
          demos_completed?: string[] | null
          demos_viewed?: string[] | null
          email?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          last_accessed_at?: string | null
          name?: string | null
          pain_level?: string | null
          pain_points?: string[] | null
          personalization?: Json | null
          primary_challenge?: string | null
          recommended_demos?: string[] | null
          roi_inputs?: Json | null
          session_token?: string | null
          source?: string | null
          team_size?: string | null
          timeline?: string | null
          updated_at?: string
          utm_params?: Json | null
          workflows_to_automate?: string[] | null
        }
        Update: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          current_tools?: string[] | null
          demos_completed?: string[] | null
          demos_viewed?: string[] | null
          email?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          last_accessed_at?: string | null
          name?: string | null
          pain_level?: string | null
          pain_points?: string[] | null
          personalization?: Json | null
          primary_challenge?: string | null
          recommended_demos?: string[] | null
          roi_inputs?: Json | null
          session_token?: string | null
          source?: string | null
          team_size?: string | null
          timeline?: string | null
          updated_at?: string
          utm_params?: Json | null
          workflows_to_automate?: string[] | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          function_name: string
          http_status: number | null
          id: string
          lead_email: string | null
          leadgen_id: string | null
          message: string | null
          meta: Json
          request_method: string | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name: string
          http_status?: number | null
          id?: string
          lead_email?: string | null
          leadgen_id?: string | null
          message?: string | null
          meta?: Json
          request_method?: string | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name?: string
          http_status?: number | null
          id?: string
          lead_email?: string | null
          leadgen_id?: string | null
          message?: string | null
          meta?: Json
          request_method?: string | null
          status?: string
        }
        Relationships: []
      }
      webinar_registrations: {
        Row: {
          ai_interest: string | null
          business_size: string | null
          company: string | null
          consent: boolean
          country: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          industry: string | null
          last_name: string | null
          phone: string | null
          reminder_sent_at: string | null
          repetitive_workflow: string | null
          role: string | null
          turnover: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          webinar_slug: string
        }
        Insert: {
          ai_interest?: string | null
          business_size?: string | null
          company?: string | null
          consent?: boolean
          country?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          industry?: string | null
          last_name?: string | null
          phone?: string | null
          reminder_sent_at?: string | null
          repetitive_workflow?: string | null
          role?: string | null
          turnover?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          webinar_slug?: string
        }
        Update: {
          ai_interest?: string | null
          business_size?: string | null
          company?: string | null
          consent?: boolean
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          industry?: string | null
          last_name?: string | null
          phone?: string | null
          reminder_sent_at?: string | null
          repetitive_workflow?: string | null
          role?: string | null
          turnover?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          webinar_slug?: string
        }
        Relationships: []
      }
      webinars_events: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          description: string | null
          event_date: string | null
          event_type: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean
          join_url: string | null
          presenter_image_url: string | null
          presenter_name: string | null
          presenter_title: string | null
          published_at: string | null
          registration_url: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          show_registration: boolean
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          join_url?: string | null
          presenter_image_url?: string | null
          presenter_name?: string | null
          presenter_title?: string | null
          published_at?: string | null
          registration_url?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_registration?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          join_url?: string | null
          presenter_image_url?: string | null
          presenter_name?: string | null
          presenter_title?: string | null
          published_at?: string | null
          registration_url?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_registration?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      bounce_funnel: {
        Row: {
          avg_scroll_pct: number | null
          avg_seconds_on_page: number | null
          book_clicks: number | null
          bounce_rate: number | null
          bounces: number | null
          day: string | null
          demo_clicks: number | null
          device: string | null
          sessions: number | null
        }
        Relationships: []
      }
      email_delivery_stats: {
        Row: {
          bounce_rate: number | null
          bounced: number | null
          click_rate: number | null
          clicked: number | null
          delivered: number | null
          delivery_rate: number | null
          failed: number | null
          open_rate: number | null
          opened: number | null
          template_key: string | null
          total_sent: number | null
        }
        Relationships: []
      }
      faq_engagement_funnel: {
        Row: {
          booked: boolean | null
          converted: boolean | null
          engagement_id: string | null
          faq_group: string | null
          faq_question: string | null
          faq_slug: string | null
          ghl_status: string | null
          lead_email: string | null
          lead_source: string | null
          medium: string | null
          opened_at: string | null
          page_path: string | null
          session_id: string | null
          source: string | null
          source_medium: string | null
          submission_id: string | null
          submitted_at: string | null
          visitor_email: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_users_stored_email: { Args: { _id: string }; Returns: string }
      admin_users_stored_role: {
        Args: { _id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      can_manage_content: { Args: { _user_id: string }; Returns: boolean }
      can_view_leads: { Args: { _user_id: string }; Returns: boolean }
      can_view_registrations: { Args: { _user_id: string }; Returns: boolean }
      confirm_quote_payment: {
        Args: { p_payment_id: string }
        Returns: boolean
      }
      connector_health_jobs: {
        Args: never
        Returns: {
          active: boolean
          failed_7d: number
          jobname: string
          last_error: string
          last_run: string
          last_status: string
          runs_7d: number
          schedule: string
        }[]
      }
      connector_health_webhooks: {
        Args: never
        Returns: {
          avg_ms: number
          failures: number
          function_name: string
          last_error: string
          last_run: string
          runs: number
        }[]
      }
      create_email_tracking: {
        Args: { p_links?: string[]; p_log_id: string }
        Returns: {
          click_tokens: Json
          open_token: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_bot_user_agent: { Args: { ua: string }; Returns: boolean }
      distributor_can_access: {
        Args: {
          _assigned: string
          _creator: string
          _entity_id: string
          _entity_type: string
        }
        Returns: boolean
      }
      diy_request_stored_reviewer: { Args: { _id: string }; Returns: string }
      diy_request_stored_status: { Args: { _id: string }; Returns: string }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_quote_access_code: { Args: never; Returns: string }
      generate_tracking_token: { Args: never; Returns: string }
      get_admin_dashboard_lead_counts: {
        Args: never
        Returns: {
          ghl_submissions_count: number
          leads_booked_count: number
          leads_count: number
          meetings_count: number
        }[]
      }
      get_blog_view_counts: {
        Args: never
        Returns: {
          blog_id: string
          total_views: number
          views_30d: number
          views_7d: number
        }[]
      }
      get_daily_email_stats: {
        Args: { days_back?: number }
        Returns: {
          bounced: number
          date: string
          delivered: number
          failed: number
          opened: number
          sent: number
        }[]
      }
      get_daily_performance_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_value: number
          date: string
          metric_name: string
          sample_count: number
        }[]
      }
      get_demo_view_counts: {
        Args: never
        Returns: {
          demo_id: string
          total_views: number
          views_30d: number
          views_7d: number
        }[]
      }
      get_distributor_dashboard_stats: {
        Args: never
        Returns: {
          active_opportunities: number
          assigned_leads: number
          closed_deals: number
          conversion_rate: number
          follow_up_tasks: number
          personal_revenue: number
          pipeline_value: number
        }[]
      }
      get_distributor_quotes: {
        Args: never
        Returns: {
          assigned_distributor_id: string
          bundle_pricing: boolean
          challenges: string[]
          company_name: string
          contact_email: string
          contact_name: string
          contract_months: number
          created_at: string
          created_by: string
          created_by_user_id: string
          current_tech_stack: Json
          handover_status: string
          handover_triggered_at: string
          id: string
          industry: string
          last_edited_at: string
          last_edited_by: string
          monthly_retainer_final: number
          monthly_retainer_max: number
          monthly_retainer_min: number
          outcome: string
          payback_months_best: number
          payback_months_conservative: number
          payback_months_likely: number
          poc_requested: boolean
          pricing_option: string
          quote_id: string
          roi_best: number
          roi_conservative: number
          roi_likely: number
          setup_fee_final: number
          setup_fee_max: number
          setup_fee_min: number
          signed_at: string
          signed_by_email: string
          signed_by_name: string
          status: string
          team_size: number
          timeline: string
          updated_at: string
          voice_agent_addons: Json
          voice_agent_monthly_cost: number
          voice_agent_plan: string
          voice_agent_setup_cost: number
          voice_agent_workflow_count: number
          workflows: Json
        }[]
      }
      get_email_delivery_overview: {
        Args: { days_back?: number }
        Returns: {
          bounce_rate: number
          click_rate: number
          delivery_rate: number
          open_rate: number
          total_bounced: number
          total_clicked: number
          total_delivered: number
          total_failed: number
          total_opened: number
          total_sent: number
        }[]
      }
      get_job_run_details: {
        Args: { job_name?: string }
        Returns: {
          command: string
          database: string
          end_time: string
          job_pid: number
          jobid: number
          return_message: string
          runid: number
          start_time: string
          status: string
          username: string
        }[]
      }
      get_performance_overview: {
        Args: { days_back?: number }
        Returns: {
          avg_value: number
          good_count: number
          metric_name: string
          needs_improvement_count: number
          p75_value: number
          p95_value: number
          poor_count: number
          total_count: number
        }[]
      }
      get_proposal_view_stats: {
        Args: { p_quote_id: string }
        Returns: {
          desktop_views: number
          first_view_at: string
          last_view_at: string
          mobile_views: number
          total_views: number
          unique_sessions: number
        }[]
      }
      get_quote_versions_safe: {
        Args: { p_quote_id: string }
        Returns: {
          challenges: string[]
          change_summary: string
          company_name: string
          contact_email: string
          contact_name: string
          contract_months: number
          created_at: string
          created_by: string
          current_tech_stack: Json
          id: string
          industry: string
          monthly_retainer_final: number
          monthly_retainer_max: number
          monthly_retainer_min: number
          quote_id: string
          roi_best: number
          roi_conservative: number
          roi_likely: number
          setup_fee_final: number
          setup_fee_max: number
          setup_fee_min: number
          team_size: number
          timeline: string
          version_number: number
          voice_agent_monthly_cost: number
          voice_agent_plan: string
          voice_agent_setup_cost: number
          voice_agent_workflow_count: number
          workflows: Json
        }[]
      }
      get_scheduled_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_short_link_click: {
        Args: { p_code: string }
        Returns: {
          destination_url: string
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_distributor: { Args: { _user_id: string }; Returns: boolean }
      is_email_suppressed: { Args: { check_email: string }; Returns: boolean }
      is_full_admin: { Args: { _user_id: string }; Returns: boolean }
      is_partner_admin: { Args: { _user_id: string }; Returns: boolean }
      is_record_collaborator: {
        Args: { _entity_id: string; _entity_type: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      partner_actor_name: { Args: { _uid: string }; Returns: string }
      partner_profile_flag: {
        Args: { _flag: string; _user_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      suppress_email: {
        Args: {
          p_bounce_message?: string
          p_bounce_type?: string
          p_email: string
          p_expires_days?: number
          p_reason: string
          p_source_log_id?: string
        }
        Returns: string
      }
      update_page_engagement: {
        Args: {
          p_bounced: boolean
          p_engaged: boolean
          p_exit_section: string
          p_id: string
          p_last_active_at: string
          p_max_scroll_pct: number
          p_primary_cta_clicks: Json
          p_session_id: string
        }
        Returns: undefined
      }
      verify_invitation_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          invited_by_email: string
          role: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "super_admin" | "sales_rep" | "distributor"
      content_status: "draft" | "published" | "archived"
      investor_lead_status: "pending_review" | "approved" | "rejected"
      keyword_category: "branded" | "category" | "competitor" | "long_tail"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "super_admin", "sales_rep", "distributor"],
      content_status: ["draft", "published", "archived"],
      investor_lead_status: ["pending_review", "approved", "rejected"],
      keyword_category: ["branded", "category", "competitor", "long_tail"],
    },
  },
} as const
