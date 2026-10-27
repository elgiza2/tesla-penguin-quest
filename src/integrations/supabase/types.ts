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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      tsla_ad_views: {
        Row: {
          confirmed_at: string | null
          consumed_by: string | null
          created_at: string
          id: string
          user_id: number
          zone_id: string
        }
        Insert: {
          confirmed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          user_id: number
          zone_id?: string
        }
        Update: {
          confirmed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          user_id?: number
          zone_id?: string
        }
        Relationships: []
      }
      tsla_arcade_rounds: {
        Row: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          score?: number
          state?: Json
          status?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          score?: number
          state?: Json
          status?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_arcade_rounds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_bot_campaigns: {
        Row: {
          created_at: string
          failed: number
          id: string
          last_user_id: number
          lease_token: string | null
          lease_until: string | null
          max_user_id: number
          messages: Json
          pause_reason: string | null
          sent: number
          status: string
        }
        Insert: {
          created_at?: string
          failed?: number
          id?: string
          last_user_id?: number
          lease_token?: string | null
          lease_until?: string | null
          max_user_id: number
          messages: Json
          pause_reason?: string | null
          sent?: number
          status?: string
        }
        Update: {
          created_at?: string
          failed?: number
          id?: string
          last_user_id?: number
          lease_token?: string | null
          lease_until?: string | null
          max_user_id?: number
          messages?: Json
          pause_reason?: string | null
          sent?: number
          status?: string
        }
        Relationships: []
      }
      tsla_game_spins: {
        Row: {
          created_at: string
          last_spun_at: string | null
          reward: number
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          last_spun_at?: string | null
          reward?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          last_spun_at?: string | null
          reward?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
      tsla_market_snapshots: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tsla_nfts: {
        Row: {
          created_at: string
          id: string
          item_index: number | null
          mint_status: string
          nft_address: string | null
          price_gram: number
          tier: number
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_index?: number | null
          mint_status?: string
          nft_address?: string | null
          price_gram?: number
          tier?: number
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          id?: string
          item_index?: number | null
          mint_status?: string
          nft_address?: string | null
          price_gram?: number
          tier?: number
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: []
      }
      tsla_payout_lock: {
        Row: {
          expires_at: string | null
          id: number
          token: string | null
        }
        Insert: {
          expires_at?: string | null
          id: number
          token?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: number
          token?: string | null
        }
        Relationships: []
      }
      tsla_referral_goals: {
        Row: {
          claimed_at: string
          goal: number
          reward: number
          user_id: number
        }
        Insert: {
          claimed_at?: string
          goal: number
          reward: number
          user_id: number
        }
        Update: {
          claimed_at?: string
          goal?: number
          reward?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_referral_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_task_apps: {
        Row: {
          category: string
          created_at: string
          id: string
          image: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image?: string
          name?: string
        }
        Relationships: []
      }
      tsla_task_completions: {
        Row: {
          created_at: string
          task_id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          task_id: string
          user_id: number
        }
        Update: {
          created_at?: string
          task_id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tsla_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_tasks: {
        Row: {
          active: boolean
          app_category: string
          app_id: string | null
          app_image: string | null
          app_name: string | null
          chat_id: string | null
          created_at: string
          id: string
          image_url: string | null
          kind: string
          link: string
          reward: number
          sort: number
          title: string
          title_i18n: Json
        }
        Insert: {
          active?: boolean
          app_category?: string
          app_id?: string | null
          app_image?: string | null
          app_name?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link: string
          reward?: number
          sort?: number
          title: string
          title_i18n?: Json
        }
        Update: {
          active?: boolean
          app_category?: string
          app_id?: string | null
          app_image?: string | null
          app_name?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string
          reward?: number
          sort?: number
          title?: string
          title_i18n?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tsla_tasks_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "tsla_task_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_tg_users: {
        Row: {
          balance: number
          created_at: string
          first_name: string | null
          id: number
          language_code: string | null
          mining_claim_count: number
          mining_pending: number
          mining_rate_daily: number
          mining_settled_at: string | null
          mining_started_at: string | null
          photo_url: string | null
          power_level: number
          referral_earned: number
          referral_mining_paid: boolean
          referral_rate: number
          referral_signup_paid: boolean
          referral_wallet_paid: boolean
          referred_by: number | null
          starter_credit_applied: boolean
          subscribed_until: string | null
          tickets: number
          tickets_daily_at: string | null
          username: string | null
          wallet_address: string | null
          wallet_nonce: string | null
          wallet_verified: boolean
        }
        Insert: {
          balance?: number
          created_at?: string
          first_name?: string | null
          id: number
          language_code?: string | null
          mining_claim_count?: number
          mining_pending?: number
          mining_rate_daily?: number
          mining_settled_at?: string | null
          mining_started_at?: string | null
          photo_url?: string | null
          power_level?: number
          referral_earned?: number
          referral_mining_paid?: boolean
          referral_rate?: number
          referral_signup_paid?: boolean
          referral_wallet_paid?: boolean
          referred_by?: number | null
          starter_credit_applied?: boolean
          subscribed_until?: string | null
          tickets?: number
          tickets_daily_at?: string | null
          username?: string | null
          wallet_address?: string | null
          wallet_nonce?: string | null
          wallet_verified?: boolean
        }
        Update: {
          balance?: number
          created_at?: string
          first_name?: string | null
          id?: number
          language_code?: string | null
          mining_claim_count?: number
          mining_pending?: number
          mining_rate_daily?: number
          mining_settled_at?: string | null
          mining_started_at?: string | null
          photo_url?: string | null
          power_level?: number
          referral_earned?: number
          referral_mining_paid?: boolean
          referral_rate?: number
          referral_signup_paid?: boolean
          referral_wallet_paid?: boolean
          referred_by?: number | null
          starter_credit_applied?: boolean
          subscribed_until?: string | null
          tickets?: number
          tickets_daily_at?: string | null
          username?: string | null
          wallet_address?: string | null
          wallet_nonce?: string | null
          wallet_verified?: boolean
        }
        Relationships: []
      }
      tsla_ticket_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_key: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_key: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_key?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tsla_ticket_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tsla_tg_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tsla_withdrawals: {
        Row: {
          amount: number
          broadcast_boc: string | null
          broadcast_error: string | null
          broadcast_seqno: number | null
          created_at: string
          fee_tsla: number
          fee_tx: string | null
          id: string
          status: string
          to_address: string
          tx_hash: string | null
          user_id: number
        }
        Insert: {
          amount: number
          broadcast_boc?: string | null
          broadcast_error?: string | null
          broadcast_seqno?: number | null
          created_at?: string
          fee_tsla?: number
          fee_tx?: string | null
          id?: string
          status?: string
          to_address: string
          tx_hash?: string | null
          user_id: number
        }
        Update: {
          amount?: number
          broadcast_boc?: string | null
          broadcast_error?: string | null
          broadcast_seqno?: number | null
          created_at?: string
          fee_tsla?: number
          fee_tx?: string | null
          id?: string
          status?: string
          to_address?: string
          tx_hash?: string | null
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tesla_campaign_lock: {
        Args: { p_id: string; p_token: string }
        Returns: boolean
      }
      tesla_mining_claim: { Args: { p_user_id: number }; Returns: Json }
      tesla_paid_withdrawal: {
        Args: { p_address: string; p_amount: number; p_user_id: number }
        Returns: string
      }
      tesla_payout_lock: { Args: { p_token: string }; Returns: boolean }
      tesla_refund_withdrawal: { Args: { p_id: string }; Returns: undefined }
      tesla_reserve_withdrawal: {
        Args: {
          p_address: string
          p_amount: number
          p_fee: string
          p_user_id: number
        }
        Returns: string
      }
      tesla_spin_daily: { Args: { p_user_id: number }; Returns: Json }
      tesla_sync_power: {
        Args: { p_level: number; p_rate: number; p_user_id: number }
        Returns: undefined
      }
      tsla_arcade_leaderboard: {
        Args: { p_game: string }
        Returns: {
          best: number
          first_name: string
          photo_url: string
          user_id: number
          username: string
        }[]
      }
      tsla_arcade_start: {
        Args: { p_game: string; p_state: Json; p_user: number }
        Returns: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        SetofOptions: {
          from: "*"
          to: "tsla_arcade_rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tsla_arcade_update: {
        Args: {
          p_id: string
          p_score: number
          p_state: Json
          p_status: string
          p_user: number
          p_version: string
        }
        Returns: {
          created_at: string
          game: string
          id: string
          score: number
          state: Json
          status: string
          updated_at: string
          user_id: number
        }
        SetofOptions: {
          from: "*"
          to: "tsla_arcade_rounds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tsla_claim_referral_goal: {
        Args: { p_goal: number; p_user_id: number }
        Returns: number
      }
      tsla_daily_tickets: { Args: { p_user: number }; Returns: number }
      tsla_grant_tickets: {
        Args: {
          p_amount: number
          p_key: string
          p_source: string
          p_user: number
        }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
