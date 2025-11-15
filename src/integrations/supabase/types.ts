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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amigos: {
        Row: {
          amigo_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amigo_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amigo_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          cakto_checkout_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          perfil_id: string | null
          periodo: string
          plano: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cakto_checkout_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio?: string
          id?: string
          perfil_id?: string | null
          periodo: string
          plano?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          cakto_checkout_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          perfil_id?: string | null
          periodo?: string
          plano?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_assinaturas_perfil"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cakto_checkouts: {
        Row: {
          amount: number | null
          checkout_id: string | null
          created_at: string
          id: string
          periodo: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          checkout_id?: string | null
          created_at?: string
          id?: string
          periodo?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          checkout_id?: string | null
          created_at?: string
          id?: string
          periodo?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comentarios_publicacoes: {
        Row: {
          comentario: string
          created_at: string
          id: string
          publicacao_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          publicacao_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          publicacao_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant1_id: string
          participant2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant1_id: string
          participant2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant1_id?: string
          participant2_id?: string
        }
        Relationships: []
      }
      curtidas_publicacoes: {
        Row: {
          created_at: string
          id: string
          publicacao_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          publicacao_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          publicacao_id?: string
          user_id?: string
        }
        Relationships: []
      }
      depoimentos: {
        Row: {
          autor_id: string
          created_at: string
          destinatario_id: string
          id: string
          status: string
          texto: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          destinatario_id: string
          id?: string
          status?: string
          texto: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          destinatario_id?: string
          id?: string
          status?: string
          texto?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          from_user_id: string | null
          id: string
          read_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          read_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          read_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          likes_count: number | null
          media_type: Database["public"]["Enums"]["post_type"]
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: Database["public"]["Enums"]["post_type"]
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: Database["public"]["Enums"]["post_type"]
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_visits: {
        Row: {
          created_at: string
          id: string
          visited_user_id: string
          visitor_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          visited_user_id: string
          visitor_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          visited_user_id?: string
          visitor_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          body_type: Database["public"]["Enums"]["body_type"] | null
          city: string | null
          created_at: string
          display_name: string
          drinks: boolean | null
          ethnicity: Database["public"]["Enums"]["ethnicity_type"] | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height: number | null
          id: string
          interests: string[] | null
          last_seen: string | null
          looking_for: string | null
          objectives: string | null
          profession: string | null
          profile_completed: boolean | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          sexual_orientation:
            | Database["public"]["Enums"]["orientation_type"]
            | null
          smokes: boolean | null
          state: string | null
          status_online: string | null
          tipo_assinatura: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          body_type?: Database["public"]["Enums"]["body_type"] | null
          city?: string | null
          created_at?: string
          display_name: string
          drinks?: boolean | null
          ethnicity?: Database["public"]["Enums"]["ethnicity_type"] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height?: number | null
          id?: string
          interests?: string[] | null
          last_seen?: string | null
          looking_for?: string | null
          objectives?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          sexual_orientation?:
            | Database["public"]["Enums"]["orientation_type"]
            | null
          smokes?: boolean | null
          state?: string | null
          status_online?: string | null
          tipo_assinatura?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          body_type?: Database["public"]["Enums"]["body_type"] | null
          city?: string | null
          created_at?: string
          display_name?: string
          drinks?: boolean | null
          ethnicity?: Database["public"]["Enums"]["ethnicity_type"] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height?: number | null
          id?: string
          interests?: string[] | null
          last_seen?: string | null
          looking_for?: string | null
          objectives?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          sexual_orientation?:
            | Database["public"]["Enums"]["orientation_type"]
            | null
          smokes?: boolean | null
          state?: string | null
          status_online?: string | null
          tipo_assinatura?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      publicacao_midias: {
        Row: {
          created_at: string
          id: string
          midia_url: string
          ordem: number
          publicacao_id: string
          tipo_midia: string
        }
        Insert: {
          created_at?: string
          id?: string
          midia_url: string
          ordem?: number
          publicacao_id: string
          tipo_midia?: string
        }
        Update: {
          created_at?: string
          id?: string
          midia_url?: string
          ordem?: number
          publicacao_id?: string
          tipo_midia?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacao_midias_publicacao_id_fkey"
            columns: ["publicacao_id"]
            isOneToOne: false
            referencedRelation: "publicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacoes: {
        Row: {
          comentarios_count: number | null
          created_at: string
          curtidas_count: number | null
          descricao: string | null
          id: string
          midia_url: string | null
          tipo_midia: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comentarios_count?: number | null
          created_at?: string
          curtidas_count?: number | null
          descricao?: string | null
          id?: string
          midia_url?: string | null
          tipo_midia?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comentarios_count?: number | null
          created_at?: string
          curtidas_count?: number | null
          descricao?: string | null
          id?: string
          midia_url?: string | null
          tipo_midia?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitacoes_amizade: {
        Row: {
          created_at: string
          destinatario_id: string
          id: string
          remetente_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          id?: string
          remetente_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          id?: string
          remetente_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_posts: {
        Row: {
          comments_count: number | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          likes_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          likes_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          likes_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_get_all_users: {
        Args: {
          filter_type?: string
          limit_count?: number
          offset_count?: number
          search_term?: string
        }
        Returns: {
          avatar_url: string
          birth_date: string
          city: string
          created_at: string
          display_name: string
          email: string
          gender: string
          id: string
          last_seen: string
          state: string
          tipo_assinatura: string
          user_id: string
        }[]
      }
      admin_grant_premium: {
        Args: { days?: number; target_user_id: string }
        Returns: undefined
      }
      admin_revoke_premium: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_age_distribution: {
        Args: never
        Returns: {
          age_group: string
          count: number
        }[]
      }
      get_users_history: {
        Args: never
        Returns: {
          count: number
          date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verificar_status_premium: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      body_type: "magro" | "atletico" | "mediano" | "curvilinio" | "plus_size"
      ethnicity_type:
        | "branco"
        | "negro"
        | "pardo"
        | "amarelo"
        | "indigena"
        | "outro"
      gender_type: "masculino" | "feminino" | "nao_binario" | "outro"
      notification_type:
        | "curtida"
        | "comentario"
        | "visita"
        | "mensagem"
        | "novo_amigo"
      orientation_type:
        | "heterossexual"
        | "homossexual"
        | "bissexual"
        | "pansexual"
        | "outro"
      post_type: "texto" | "imagem" | "video"
      relationship_status:
        | "solteiro"
        | "casado"
        | "relacionamento"
        | "divorciado"
        | "viuvo"
      subscription_type: "gratuito" | "premium"
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
    Enums: {
      app_role: ["admin", "user"],
      body_type: ["magro", "atletico", "mediano", "curvilinio", "plus_size"],
      ethnicity_type: [
        "branco",
        "negro",
        "pardo",
        "amarelo",
        "indigena",
        "outro",
      ],
      gender_type: ["masculino", "feminino", "nao_binario", "outro"],
      notification_type: [
        "curtida",
        "comentario",
        "visita",
        "mensagem",
        "novo_amigo",
      ],
      orientation_type: [
        "heterossexual",
        "homossexual",
        "bissexual",
        "pansexual",
        "outro",
      ],
      post_type: ["texto", "imagem", "video"],
      relationship_status: [
        "solteiro",
        "casado",
        "relacionamento",
        "divorciado",
        "viuvo",
      ],
      subscription_type: ["gratuito", "premium"],
    },
  },
} as const
