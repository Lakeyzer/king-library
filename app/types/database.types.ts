export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      adaptation_short_stories: {
        Row: {
          adaptation_id: string
          id: string
          short_story_id: string
        }
        Insert: {
          adaptation_id: string
          id?: string
          short_story_id: string
        }
        Update: {
          adaptation_id?: string
          id?: string
          short_story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adaptation_short_stories_adaptation_id_fkey"
            columns: ["adaptation_id"]
            isOneToOne: false
            referencedRelation: "adaptations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptation_short_stories_short_story_id_fkey"
            columns: ["short_story_id"]
            isOneToOne: false
            referencedRelation: "king_short_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      adaptation_works: {
        Row: {
          adaptation_id: string
          id: string
          king_work_id: string
        }
        Insert: {
          adaptation_id: string
          id?: string
          king_work_id: string
        }
        Update: {
          adaptation_id?: string
          id?: string
          king_work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adaptation_works_adaptation_id_fkey"
            columns: ["adaptation_id"]
            isOneToOne: false
            referencedRelation: "adaptations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptation_works_king_work_id_fkey"
            columns: ["king_work_id"]
            isOneToOne: false
            referencedRelation: "king_works"
            referencedColumns: ["id"]
          },
        ]
      }
      adaptations: {
        Row: {
          id: string
          is_universe_only: boolean
          notes: string | null
          release_year: number
          title: string
          tmdb_id: number | null
          tmdb_media_type: string | null
          tmdb_poster_path: string | null
          type: string
        }
        Insert: {
          id?: string
          is_universe_only?: boolean
          notes?: string | null
          release_year: number
          title: string
          tmdb_id?: number | null
          tmdb_media_type?: string | null
          tmdb_poster_path?: string | null
          type: string
        }
        Update: {
          id?: string
          is_universe_only?: boolean
          notes?: string | null
          release_year?: number
          title?: string
          tmdb_id?: number | null
          tmdb_media_type?: string | null
          tmdb_poster_path?: string | null
          type?: string
        }
        Relationships: []
      }
      king_short_stories: {
        Row: {
          dark_tower: boolean
          dark_tower_relation: string | null
          first_published_in: string | null
          id: string
          original_publish_year: number | null
          title: string
          type: string
        }
        Insert: {
          dark_tower?: boolean
          dark_tower_relation?: string | null
          first_published_in?: string | null
          id?: string
          original_publish_year?: number | null
          title: string
          type: string
        }
        Update: {
          dark_tower?: boolean
          dark_tower_relation?: string | null
          first_published_in?: string | null
          id?: string
          original_publish_year?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      king_short_story_collections: {
        Row: {
          id: string
          king_work_id: string
          order_in_collection: number | null
          short_story_id: string
        }
        Insert: {
          id?: string
          king_work_id: string
          order_in_collection?: number | null
          short_story_id: string
        }
        Update: {
          id?: string
          king_work_id?: string
          order_in_collection?: number | null
          short_story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "king_short_story_collections_king_work_id_fkey"
            columns: ["king_work_id"]
            isOneToOne: false
            referencedRelation: "king_works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "king_short_story_collections_short_story_id_fkey"
            columns: ["short_story_id"]
            isOneToOne: false
            referencedRelation: "king_short_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      king_works: {
        Row: {
          bachman: boolean
          cover_id: number | null
          dark_tower: boolean
          dark_tower_relation: string | null
          id: string
          open_library_work_key: string | null
          original_publish_year: number
          title: string
          type: string
        }
        Insert: {
          bachman?: boolean
          cover_id?: number | null
          dark_tower?: boolean
          dark_tower_relation?: string | null
          id?: string
          open_library_work_key?: string | null
          original_publish_year: number
          title: string
          type: string
        }
        Update: {
          bachman?: boolean
          cover_id?: number | null
          dark_tower?: boolean
          dark_tower_relation?: string | null
          id?: string
          open_library_work_key?: string | null
          original_publish_year?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_public: boolean
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_public?: boolean
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          username?: string | null
        }
        Relationships: []
      }
      user_books: {
        Row: {
          currently_reading: boolean
          finished_on: string | null
          id: string
          king_work_id: string
          owned: boolean
          read: boolean
          read_year: number | null
          started_on: string | null
          user_id: string
          want_to_read: boolean
          wishlisted: boolean
        }
        Insert: {
          currently_reading?: boolean
          finished_on?: string | null
          id?: string
          king_work_id: string
          owned?: boolean
          read?: boolean
          read_year?: number | null
          started_on?: string | null
          user_id: string
          want_to_read?: boolean
          wishlisted?: boolean
        }
        Update: {
          currently_reading?: boolean
          finished_on?: string | null
          id?: string
          king_work_id?: string
          owned?: boolean
          read?: boolean
          read_year?: number | null
          started_on?: string | null
          user_id?: string
          want_to_read?: boolean
          wishlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_books_king_work_id_fkey"
            columns: ["king_work_id"]
            isOneToOne: false
            referencedRelation: "king_works"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

