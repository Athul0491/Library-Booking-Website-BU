// Database type definitions for Library Booking System (Simplified Schema)

export interface Database {
  public: {
    Tables: {
      buildings: {
        Row: {
          id: number
          name: string
          short_name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          short_name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          short_name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: number
          building_id: number
          name: string
          short_name: string | null
          room_number: string | null
          capacity: number | null
          equipment: string[] | null
          is_bookable: boolean
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          building_id: number
          name: string
          short_name?: string | null
          room_number?: string | null
          capacity?: number | null
          equipment?: string[] | null
          is_bookable?: boolean
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          building_id?: number
          name?: string
          short_name?: string | null
          room_number?: string | null
          capacity?: number | null
          equipment?: string[] | null
          is_bookable?: boolean
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          user_type: 'student' | 'faculty' | 'staff' | 'guest'
          booking_count: number
          last_booking_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          user_type?: 'student' | 'faculty' | 'staff' | 'guest'
          booking_count?: number
          last_booking_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          user_type?: 'student' | 'faculty' | 'staff' | 'guest'
          booking_count?: number
          last_booking_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          room_id: number
          start_time: string
          end_time: string
          purpose: string | null
          notes: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          booking_source: 'web' | 'mobile' | 'admin' | 'api'
          confirmation_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          room_id: number
          start_time: string
          end_time: string
          purpose?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          booking_source?: 'web' | 'mobile' | 'admin' | 'api'
          confirmation_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          room_id?: number
          start_time?: string
          end_time?: string
          purpose?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          booking_source?: 'web' | 'mobile' | 'admin' | 'api'
          confirmation_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      system_config: {
        Row: {
          id: number
          key: string
          value: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          key: string
          value: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          key?: string
          value?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'student' | 'faculty' | 'staff' | 'guest'
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
      booking_source: 'web' | 'mobile' | 'admin' | 'api'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenient type aliases
export type Building = Database['public']['Tables']['buildings']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type SystemConfig = Database['public']['Tables']['system_config']['Row']

export type BuildingInsert = Database['public']['Tables']['buildings']['Insert']
export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type SystemConfigInsert = Database['public']['Tables']['system_config']['Insert']

export type BuildingUpdate = Database['public']['Tables']['buildings']['Update']
export type RoomUpdate = Database['public']['Tables']['rooms']['Update']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

// Additional utility types for the booking system
export interface RoomWithBuilding extends Room {
  building: Building
}

export interface BookingWithDetails extends Booking {
  room: RoomWithBuilding
  user_profile: UserProfile
}

export interface AvailabilitySlot {
  start_time: string
  end_time: string
  is_available: boolean
  room_id: number
}
