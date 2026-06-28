// ----- Domain types -------------------------------------------------------

export type QuantityUnit = "Bags" | "KG";
export type UserRole = "user" | "admin";

export interface Booking {
  id: string;
  booking_date: string; // ISO date (yyyy-mm-dd)
  party_name: string;
  item_name: string;
  booking_rate: number;
  quantity: number;
  quantity_unit: QuantityUnit;
  broker: string;
  remarks: string | null;
  created_by: string; // auth user id
  booked_by_name: string; // denormalized for instant realtime display
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

/** Shape submitted from the booking form. */
export interface BookingInput {
  booking_date: string;
  party_name: string;
  item_name: string;
  booking_rate: number;
  quantity: number;
  quantity_unit: QuantityUnit;
  broker: string;
  remarks: string;
}

// ----- Supabase generated-style Database type -----------------------------
// Hand-written to match supabase/schema.sql. Lets the client be fully typed.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: Partial<Profile>;
      };
      bookings: {
        Row: Booking;
        Insert: {
          id?: string;
          booking_date?: string;
          party_name: string;
          item_name: string;
          booking_rate?: number;
          quantity?: number;
          quantity_unit?: QuantityUnit;
          broker?: string;
          remarks?: string | null;
          created_by: string;
          booked_by_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Booking>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
