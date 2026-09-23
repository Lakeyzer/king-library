export type Json
  = | string
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
            foreignKeyName: 'adaptation_short_stories_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptation_stats'
            referencedColumns: ['adaptation_id']
          },
          {
            foreignKeyName: 'adaptation_short_stories_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'adaptation_short_stories_short_story_id_fkey'
            columns: ['short_story_id']
            isOneToOne: false
            referencedRelation: 'king_short_stories'
            referencedColumns: ['id']
          }
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
            foreignKeyName: 'adaptation_works_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptation_stats'
            referencedColumns: ['adaptation_id']
          },
          {
            foreignKeyName: 'adaptation_works_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'adaptation_works_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'adaptation_works_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      adaptations: {
        Row: {
          active: boolean
          id: string
          is_universe_only: boolean
          notes: string | null
          release_year: number
          slug: string
          title: string
          tmdb_id: number | null
          tmdb_media_type: string | null
          tmdb_poster_path: string | null
          type: string
        }
        Insert: {
          active?: boolean
          id?: string
          is_universe_only?: boolean
          notes?: string | null
          release_year: number
          slug: string
          title: string
          tmdb_id?: number | null
          tmdb_media_type?: string | null
          tmdb_poster_path?: string | null
          type: string
        }
        Update: {
          active?: boolean
          id?: string
          is_universe_only?: boolean
          notes?: string | null
          release_year?: number
          slug?: string
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
          slug: string
          title: string
          type: string
        }
        Insert: {
          dark_tower?: boolean
          dark_tower_relation?: string | null
          first_published_in?: string | null
          id?: string
          original_publish_year?: number | null
          slug: string
          title: string
          type: string
        }
        Update: {
          dark_tower?: boolean
          dark_tower_relation?: string | null
          first_published_in?: string | null
          id?: string
          original_publish_year?: number | null
          slug?: string
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
            foreignKeyName: 'king_short_story_collections_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'king_short_story_collections_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          },
          {
            foreignKeyName: 'king_short_story_collections_short_story_id_fkey'
            columns: ['short_story_id']
            isOneToOne: false
            referencedRelation: 'king_short_stories'
            referencedColumns: ['id']
          }
        ]
      }
      king_work_omnibus_works: {
        Row: {
          component_king_work_id: string
          id: string
          omnibus_king_work_id: string
        }
        Insert: {
          component_king_work_id: string
          id?: string
          omnibus_king_work_id: string
        }
        Update: {
          component_king_work_id?: string
          id?: string
          omnibus_king_work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'king_work_omnibus_works_component_king_work_id_fkey'
            columns: ['component_king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'king_work_omnibus_works_component_king_work_id_fkey'
            columns: ['component_king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          },
          {
            foreignKeyName: 'king_work_omnibus_works_omnibus_king_work_id_fkey'
            columns: ['omnibus_king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'king_work_omnibus_works_omnibus_king_work_id_fkey'
            columns: ['omnibus_king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      king_works: {
        Row: {
          active: boolean
          bachman: boolean
          co_author: string | null
          counts_with_id: string | null
          cover_id: number | null
          dark_tower: boolean
          dark_tower_relation: string | null
          description: string | null
          edition_year_max: number | null
          edition_year_min: number | null
          id: string
          open_library_work_key: string | null
          publish_date: string
          remark: string | null
          shuffle_position: number
          slug: string
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          bachman?: boolean
          co_author?: string | null
          counts_with_id?: string | null
          cover_id?: number | null
          dark_tower?: boolean
          dark_tower_relation?: string | null
          description?: string | null
          edition_year_max?: number | null
          edition_year_min?: number | null
          id?: string
          open_library_work_key?: string | null
          publish_date: string
          remark?: string | null
          shuffle_position: number
          slug: string
          title: string
          type: string
        }
        Update: {
          active?: boolean
          bachman?: boolean
          co_author?: string | null
          counts_with_id?: string | null
          cover_id?: number | null
          dark_tower?: boolean
          dark_tower_relation?: string | null
          description?: string | null
          edition_year_max?: number | null
          edition_year_min?: number | null
          id?: string
          open_library_work_key?: string | null
          publish_date?: string
          remark?: string | null
          shuffle_position?: number
          slug?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'king_works_counts_with_id_fkey'
            columns: ['counts_with_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'king_works_counts_with_id_fkey'
            columns: ['counts_with_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_public: boolean
          tagline: string | null
          username: string | null
          username_lower: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_public?: boolean
          tagline?: string | null
          username?: string | null
          username_lower?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          tagline?: string | null
          username?: string | null
          username_lower?: string | null
        }
        Relationships: []
      }
      related_work_omnibus_works: {
        Row: {
          component_related_work_id: string
          id: string
          omnibus_related_work_id: string
        }
        Insert: {
          component_related_work_id: string
          id?: string
          omnibus_related_work_id: string
        }
        Update: {
          component_related_work_id?: string
          id?: string
          omnibus_related_work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'related_work_omnibus_works_component_related_work_id_fkey'
            columns: ['component_related_work_id']
            isOneToOne: false
            referencedRelation: 'related_work_stats'
            referencedColumns: ['related_work_id']
          },
          {
            foreignKeyName: 'related_work_omnibus_works_component_related_work_id_fkey'
            columns: ['component_related_work_id']
            isOneToOne: false
            referencedRelation: 'related_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'related_work_omnibus_works_omnibus_related_work_id_fkey'
            columns: ['omnibus_related_work_id']
            isOneToOne: false
            referencedRelation: 'related_work_stats'
            referencedColumns: ['related_work_id']
          },
          {
            foreignKeyName: 'related_work_omnibus_works_omnibus_related_work_id_fkey'
            columns: ['omnibus_related_work_id']
            isOneToOne: false
            referencedRelation: 'related_works'
            referencedColumns: ['id']
          }
        ]
      }
      related_works: {
        Row: {
          active: boolean
          category: string
          cover_id: number | null
          creator: string
          description: string | null
          id: string
          is_omnibus: boolean
          open_library_work_key: string | null
          publish_date: string | null
          relation_note: string | null
          slug: string
          title: string
        }
        Insert: {
          active?: boolean
          category: string
          cover_id?: number | null
          creator: string
          description?: string | null
          id?: string
          is_omnibus?: boolean
          open_library_work_key?: string | null
          publish_date?: string | null
          relation_note?: string | null
          slug: string
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          cover_id?: number | null
          creator?: string
          description?: string | null
          id?: string
          is_omnibus?: boolean
          open_library_work_key?: string | null
          publish_date?: string | null
          relation_note?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      series_works: {
        Row: {
          id: string
          king_work_id: string
          position: number
          series_id: string
        }
        Insert: {
          id?: string
          king_work_id: string
          position: number
          series_id: string
        }
        Update: {
          id?: string
          king_work_id?: string
          position?: number
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'series_works_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'series_works_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          },
          {
            foreignKeyName: 'series_works_series_id_fkey'
            columns: ['series_id']
            isOneToOne: false
            referencedRelation: 'series'
            referencedColumns: ['id']
          }
        ]
      }
      suggestion_votes: {
        Row: {
          created_at: string
          id: string
          is_upvote: boolean
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_upvote: boolean
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_upvote?: boolean
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'suggestion_votes_suggestion_id_fkey'
            columns: ['suggestion_id']
            isOneToOne: false
            referencedRelation: 'suggestion_vote_counts'
            referencedColumns: ['suggestion_id']
          },
          {
            foreignKeyName: 'suggestion_votes_suggestion_id_fkey'
            columns: ['suggestion_id']
            isOneToOne: false
            referencedRelation: 'suggestions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'suggestion_votes_suggestion_id_fkey'
            columns: ['suggestion_id']
            isOneToOne: false
            referencedRelation: 'suggestions_with_author'
            referencedColumns: ['id']
          }
        ]
      }
      suggestions: {
        Row: {
          body: string
          created_at: string
          id: string
          is_anonymous: boolean
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_adaptations: {
        Row: {
          adaptation_id: string
          id: string
          user_id: string
          want_to_watch: boolean
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          adaptation_id: string
          id?: string
          user_id: string
          want_to_watch?: boolean
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          adaptation_id?: string
          id?: string
          user_id?: string
          want_to_watch?: boolean
          watched?: boolean
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_adaptations_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptation_stats'
            referencedColumns: ['adaptation_id']
          },
          {
            foreignKeyName: 'user_adaptations_adaptation_id_fkey'
            columns: ['adaptation_id']
            isOneToOne: false
            referencedRelation: 'adaptations'
            referencedColumns: ['id']
          }
        ]
      }
      user_book_editions: {
        Row: {
          added_at: string
          edition_id: string
          edition_title: string
          id: string
          king_work_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          edition_id: string
          edition_title: string
          id?: string
          king_work_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          edition_id?: string
          edition_title?: string
          id?: string
          king_work_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_book_editions_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_book_editions_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      user_book_reads: {
        Row: {
          created_at: string
          format: string | null
          id: string
          king_work_id: string
          note: string | null
          rating: number | null
          read_on: string | null
          read_year: number | null
          started_on: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          format?: string | null
          id?: string
          king_work_id: string
          note?: string | null
          rating?: number | null
          read_on?: string | null
          read_year?: number | null
          started_on?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          format?: string | null
          id?: string
          king_work_id?: string
          note?: string | null
          rating?: number | null
          read_on?: string | null
          read_year?: number | null
          started_on?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_book_reads_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_book_reads_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      user_books: {
        Row: {
          currently_reading: boolean
          finished_on: string | null
          format: string | null
          id: string
          king_work_id: string
          owned: boolean
          read: boolean
          read_year: number | null
          started_on: string | null
          user_id: string
          via_omnibus_id: string | null
          want_to_read: boolean
          wishlisted: boolean
        }
        Insert: {
          currently_reading?: boolean
          finished_on?: string | null
          format?: string | null
          id?: string
          king_work_id: string
          owned?: boolean
          read?: boolean
          read_year?: number | null
          started_on?: string | null
          user_id: string
          via_omnibus_id?: string | null
          want_to_read?: boolean
          wishlisted?: boolean
        }
        Update: {
          currently_reading?: boolean
          finished_on?: string | null
          format?: string | null
          id?: string
          king_work_id?: string
          owned?: boolean
          read?: boolean
          read_year?: number | null
          started_on?: string | null
          user_id?: string
          via_omnibus_id?: string | null
          want_to_read?: boolean
          wishlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'user_books_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_books_king_work_id_fkey'
            columns: ['king_work_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          },
          {
            foreignKeyName: 'user_books_via_omnibus_id_fkey'
            columns: ['via_omnibus_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_books_via_omnibus_id_fkey'
            columns: ['via_omnibus_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_related_work_editions: {
        Row: {
          added_at: string
          edition_id: string
          edition_title: string
          id: string
          related_work_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          edition_id: string
          edition_title: string
          id?: string
          related_work_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          edition_id?: string
          edition_title?: string
          id?: string
          related_work_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_related_work_editions_related_work_id_fkey'
            columns: ['related_work_id']
            isOneToOne: false
            referencedRelation: 'related_work_stats'
            referencedColumns: ['related_work_id']
          },
          {
            foreignKeyName: 'user_related_work_editions_related_work_id_fkey'
            columns: ['related_work_id']
            isOneToOne: false
            referencedRelation: 'related_works'
            referencedColumns: ['id']
          }
        ]
      }
      user_related_works: {
        Row: {
          currently_reading: boolean
          finished_on: string | null
          format: string | null
          id: string
          note: string | null
          owned: boolean
          rating: number | null
          read: boolean
          related_work_id: string
          started_on: string | null
          user_id: string
          via_omnibus_id: string | null
          want_to_read: boolean
        }
        Insert: {
          currently_reading?: boolean
          finished_on?: string | null
          format?: string | null
          id?: string
          note?: string | null
          owned?: boolean
          rating?: number | null
          read?: boolean
          related_work_id: string
          started_on?: string | null
          user_id: string
          via_omnibus_id?: string | null
          want_to_read?: boolean
        }
        Update: {
          currently_reading?: boolean
          finished_on?: string | null
          format?: string | null
          id?: string
          note?: string | null
          owned?: boolean
          rating?: number | null
          read?: boolean
          related_work_id?: string
          started_on?: string | null
          user_id?: string
          via_omnibus_id?: string | null
          want_to_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'user_related_works_related_work_id_fkey'
            columns: ['related_work_id']
            isOneToOne: false
            referencedRelation: 'related_work_stats'
            referencedColumns: ['related_work_id']
          },
          {
            foreignKeyName: 'user_related_works_related_work_id_fkey'
            columns: ['related_work_id']
            isOneToOne: false
            referencedRelation: 'related_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_related_works_via_omnibus_id_fkey'
            columns: ['via_omnibus_id']
            isOneToOne: false
            referencedRelation: 'related_work_stats'
            referencedColumns: ['related_work_id']
          },
          {
            foreignKeyName: 'user_related_works_via_omnibus_id_fkey'
            columns: ['via_omnibus_id']
            isOneToOne: false
            referencedRelation: 'related_works'
            referencedColumns: ['id']
          }
        ]
      }
      user_short_story_reads: {
        Row: {
          id: string
          read_at: string
          short_story_id: string
          user_id: string
          via_collection_id: string | null
        }
        Insert: {
          id?: string
          read_at?: string
          short_story_id: string
          user_id: string
          via_collection_id?: string | null
        }
        Update: {
          id?: string
          read_at?: string
          short_story_id?: string
          user_id?: string
          via_collection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_short_story_reads_short_story_id_fkey'
            columns: ['short_story_id']
            isOneToOne: false
            referencedRelation: 'king_short_stories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_short_story_reads_via_collection_id_fkey'
            columns: ['via_collection_id']
            isOneToOne: false
            referencedRelation: 'king_works'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_short_story_reads_via_collection_id_fkey'
            columns: ['via_collection_id']
            isOneToOne: false
            referencedRelation: 'work_stats'
            referencedColumns: ['king_work_id']
          }
        ]
      }
    }
    Views: {
      adaptation_stats: {
        Row: {
          adaptation_id: string | null
          want_to_watch_count: number | null
          watched_count: number | null
        }
        Relationships: []
      }
      dark_tower_journey_stats: {
        Row: {
          finished_count: number | null
          not_started_count: number | null
          on_the_way_count: number | null
        }
        Relationships: []
      }
      related_work_stats: {
        Row: {
          currently_reading_count: number | null
          owner_count: number | null
          read_count: number | null
          related_work_id: string | null
          want_to_read_count: number | null
        }
        Relationships: []
      }
      suggestion_vote_counts: {
        Row: {
          downvote_count: number | null
          score: number | null
          suggestion_id: string | null
          upvote_count: number | null
        }
        Relationships: []
      }
      suggestions_with_author: {
        Row: {
          body: string | null
          created_at: string | null
          downvote_count: number | null
          id: string | null
          is_anonymous: boolean | null
          my_vote: boolean | null
          score: number | null
          status: string | null
          title: string | null
          upvote_count: number | null
          username: string | null
        }
        Relationships: []
      }
      work_stats: {
        Row: {
          currently_reading_count: number | null
          king_work_id: string | null
          owner_count: number | null
          owners_who_read_count: number | null
          read_count: number | null
          read_through_rate: number | null
          want_to_read_count: number | null
        }
        Relationships: []
      }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {}
  }
} as const
