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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          holder: Database["public"]["Enums"]["holder_type"] | null
          id: string
          installment_id: string | null
          invoice_amount: number | null
          paid_at: string | null
          payment_type: string | null
          reference_month: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["bill_source"]
          status: Database["public"]["Enums"]["bill_status"]
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          due_date: string
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          installment_id?: string | null
          invoice_amount?: number | null
          paid_at?: string | null
          payment_type?: string | null
          reference_month: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["bill_source"]
          status?: Database["public"]["Enums"]["bill_status"]
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          installment_id?: string | null
          invoice_amount?: number | null
          paid_at?: string | null
          payment_type?: string | null
          reference_month?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["bill_source"]
          status?: Database["public"]["Enums"]["bill_status"]
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          created_at: string
          holder: Database["public"]["Enums"]["holder_type"]
          id: string
          reference_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          holder: Database["public"]["Enums"]["holder_type"]
          id?: string
          reference_month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          holder?: Database["public"]["Enums"]["holder_type"]
          id?: string
          reference_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string
          due_day: number
          holder: Database["public"]["Enums"]["holder_type"] | null
          id: string
          limit_amount: number
          name: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string
          due_day: number
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          limit_amount?: number
          name: string
          user_id: string
        }
        Update: {
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          due_day?: number
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          limit_amount?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          active: boolean
          amount: number
          card_id: string | null
          category: string
          created_at: string
          due_day: number
          holder: Database["public"]["Enums"]["holder_type"] | null
          id: string
          name: string
          payment_type: string | null
          start_month: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          card_id?: string | null
          category?: string
          created_at?: string
          due_day: number
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          name: string
          payment_type?: string | null
          start_month?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          due_day?: number
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          name?: string
          payment_type?: string | null
          start_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          extra: boolean
          holder: Database["public"]["Enums"]["holder_type"]
          id: string
          received: boolean
          received_at: string | null
          reference_month: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description: string
          extra?: boolean
          holder: Database["public"]["Enums"]["holder_type"]
          id?: string
          received?: boolean
          received_at?: string | null
          reference_month: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          extra?: boolean
          holder?: Database["public"]["Enums"]["holder_type"]
          id?: string
          received?: boolean
          received_at?: string | null
          reference_month?: string
          user_id?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          active: boolean
          card_id: string | null
          category: string
          created_at: string
          description: string
          due_day: number
          holder: Database["public"]["Enums"]["holder_type"]
          id: string
          installments_count: number
          payment_type: string | null
          start_month: string
          total_amount: number
          user_id: string
        }
        Insert: {
          active?: boolean
          card_id?: string | null
          category?: string
          created_at?: string
          description: string
          due_day: number
          holder: Database["public"]["Enums"]["holder_type"]
          id?: string
          installments_count: number
          payment_type?: string | null
          start_month: string
          total_amount: number
          user_id: string
        }
        Update: {
          active?: boolean
          card_id?: string | null
          category?: string
          created_at?: string
          description?: string
          due_day?: number
          holder?: Database["public"]["Enums"]["holder_type"]
          id?: string
          installments_count?: number
          payment_type?: string | null
          start_month?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          correlation_id: string | null
          created_at: string
          error: string | null
          event: string
          id: string
          payload: Json | null
          source: string
          status: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          event: string
          id?: string
          payload?: Json | null
          source: string
          status: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          event?: string
          id?: string
          payload?: Json | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      patrimony_items: {
        Row: {
          amount: number
          as_of_month: string
          broker_or_creditor: string | null
          created_at: string
          holder: Database["public"]["Enums"]["holder_type"]
          id: string
          kind: Database["public"]["Enums"]["patrimony_kind"]
          name: string
          user_id: string
        }
        Insert: {
          amount?: number
          as_of_month?: string
          broker_or_creditor?: string | null
          created_at?: string
          holder: Database["public"]["Enums"]["holder_type"]
          id?: string
          kind: Database["public"]["Enums"]["patrimony_kind"]
          name: string
          user_id: string
        }
        Update: {
          amount?: number
          as_of_month?: string
          broker_or_creditor?: string | null
          created_at?: string
          holder?: Database["public"]["Enums"]["holder_type"]
          id?: string
          kind?: Database["public"]["Enums"]["patrimony_kind"]
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      rifa_config: {
        Row: {
          descricao: string | null
          id: string
          imagem_premio_url: string | null
          pix_copia_cola: string | null
          pix_nome_destinatario: string | null
          pix_qr_url: string | null
          preco_por_numero: number
          site_ativo: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          imagem_premio_url?: string | null
          pix_copia_cola?: string | null
          pix_nome_destinatario?: string | null
          pix_qr_url?: string | null
          preco_por_numero?: number
          site_ativo?: boolean
          titulo?: string
          updated_at?: string
        }
        Update: {
          descricao?: string | null
          id?: string
          imagem_premio_url?: string | null
          pix_copia_cola?: string | null
          pix_nome_destinatario?: string | null
          pix_qr_url?: string | null
          preco_por_numero?: number
          site_ativo?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      rifas: {
        Row: {
          comprovante_url: string | null
          created_at: string
          email_comprador: string | null
          id: string
          nome_comprador: string | null
          numero: string
          reservado_em: string | null
          reservado_por: string | null
          rg_comprador: string | null
          status: Database["public"]["Enums"]["rifa_status"]
          telefone_comprador: string | null
          updated_at: string
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          email_comprador?: string | null
          id?: string
          nome_comprador?: string | null
          numero: string
          reservado_em?: string | null
          reservado_por?: string | null
          rg_comprador?: string | null
          status?: Database["public"]["Enums"]["rifa_status"]
          telefone_comprador?: string | null
          updated_at?: string
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          email_comprador?: string | null
          id?: string
          nome_comprador?: string | null
          numero?: string
          reservado_em?: string | null
          reservado_por?: string | null
          rg_comprador?: string | null
          status?: Database["public"]["Enums"]["rifa_status"]
          telefone_comprador?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scz_addresses: {
        Row: {
          city: string
          complement: string | null
          country: string
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string | null
          number: string | null
          phone: string | null
          postal_code: string
          recipient: string
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          phone?: string | null
          postal_code: string
          recipient: string
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          phone?: string | null
          postal_code?: string
          recipient?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scz_banners: {
        Row: {
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          location: string
          position: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          location: string
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          location?: string
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scz_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_in_menu: boolean
          name: string
          parent_id: string | null
          position: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_in_menu?: boolean
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_in_menu?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scz_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "scz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scz_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      scz_hero_carousel: {
        Row: {
          active: boolean
          button_link: string | null
          button_text: string | null
          created_at: string
          id: string
          image_url: string | null
          position: number
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          position?: number
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          position?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      scz_order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "scz_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "scz_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scz_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "scz_products"
            referencedColumns: ["id"]
          },
        ]
      }
      scz_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          shipping_address: Json
          shipping_cents: number
          status: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scz_pages: {
        Row: {
          blocks: Json
          created_at: string
          created_by: string | null
          id: string
          is_system: boolean
          og_image: string | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          og_image?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_system?: boolean
          og_image?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scz_product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          r2_key: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          r2_key: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          r2_key?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scz_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "scz_products"
            referencedColumns: ["id"]
          },
        ]
      }
      scz_product_variants: {
        Row: {
          barcode: string | null
          color: string | null
          color_hex: string | null
          created_at: string
          id: string
          is_active: boolean
          model: string | null
          price_cents: number | null
          product_id: string
          promo_price: number | null
          size: string | null
          sku: string | null
          sort_order: number
          stock_min: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          price_cents?: number | null
          product_id: string
          promo_price?: number | null
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_min?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          price_cents?: number | null
          product_id?: string
          promo_price?: number | null
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock_min?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scz_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "scz_products"
            referencedColumns: ["id"]
          },
        ]
      }
      scz_products: {
        Row: {
          brand: string | null
          category_id: string | null
          collection_id: string | null
          cost_price: number | null
          created_at: string
          depth_cm: number | null
          description: string | null
          has_variants: boolean
          height_cm: number | null
          id: string
          internal_code: string | null
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          is_launch: boolean
          is_on_sale: boolean
          metadata: Json
          name: string
          og_image: string | null
          price_cents: number
          promo_price: number | null
          sale_price_cents: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          sort_order: number
          stock: number
          stock_min: number
          stock_qty: number
          stock_reserved: number
          stock_sold: number
          subcategory_id: string | null
          tags: string[] | null
          updated_at: string
          weight_g: number | null
          width_cm: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          collection_id?: string | null
          cost_price?: number | null
          created_at?: string
          depth_cm?: number | null
          description?: string | null
          has_variants?: boolean
          height_cm?: number | null
          id?: string
          internal_code?: string | null
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_launch?: boolean
          is_on_sale?: boolean
          metadata?: Json
          name: string
          og_image?: string | null
          price_cents: number
          promo_price?: number | null
          sale_price_cents?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sort_order?: number
          stock?: number
          stock_min?: number
          stock_qty?: number
          stock_reserved?: number
          stock_sold?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
          weight_g?: number | null
          width_cm?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          collection_id?: string | null
          cost_price?: number | null
          created_at?: string
          depth_cm?: number | null
          description?: string | null
          has_variants?: boolean
          height_cm?: number | null
          id?: string
          internal_code?: string | null
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_launch?: boolean
          is_on_sale?: boolean
          metadata?: Json
          name?: string
          og_image?: string | null
          price_cents?: number
          promo_price?: number | null
          sale_price_cents?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number
          stock?: number
          stock_min?: number
          stock_qty?: number
          stock_reserved?: number
          stock_sold?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
          weight_g?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scz_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "scz_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scz_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "scz_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scz_products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "scz_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scz_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      scz_stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scz_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "scz_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scz_stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "scz_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_updates: {
        Row: {
          chat_id: number | null
          processed_at: string
          update_id: number
        }
        Insert: {
          chat_id?: number | null
          processed_at?: string
          update_id: number
        }
        Update: {
          chat_id?: number | null
          processed_at?: string
          update_id?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bill_id: string | null
          card_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          holder: Database["public"]["Enums"]["holder_type"] | null
          id: string
          installment_id: string | null
          invoice_month: string | null
          payment_type: string | null
          reference_month: string | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_id?: string | null
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          installment_id?: string | null
          invoice_month?: string | null
          payment_type?: string | null
          reference_month?: string | null
          source?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_id?: string | null
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          holder?: Database["public"]["Enums"]["holder_type"] | null
          id?: string
          installment_id?: string | null
          invoice_month?: string | null
          payment_type?: string | null
          reference_month?: string | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_invoice_month: {
        Args: { _closing_day: number; _tx_date: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      bill_source: "fixed" | "card_invoice" | "manual" | "installment"
      bill_status: "pending" | "paid" | "skipped"
      category_kind:
        | "fixed"
        | "variable"
        | "installment"
        | "income"
        | "payment_type"
        | "bank"
        | "investment_type"
        | "broker"
      holder_type: "Higor" | "Mirelly"
      patrimony_kind: "investment" | "debt"
      rifa_status:
        | "disponivel"
        | "reservado"
        | "aguardando_confirmacao"
        | "pago"
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
      bill_source: ["fixed", "card_invoice", "manual", "installment"],
      bill_status: ["pending", "paid", "skipped"],
      category_kind: [
        "fixed",
        "variable",
        "installment",
        "income",
        "payment_type",
        "bank",
        "investment_type",
        "broker",
      ],
      holder_type: ["Higor", "Mirelly"],
      patrimony_kind: ["investment", "debt"],
      rifa_status: [
        "disponivel",
        "reservado",
        "aguardando_confirmacao",
        "pago",
      ],
    },
  },
} as const
