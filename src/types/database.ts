export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'employee' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'employee' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'employee' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      availabilities: {
        Row: {
          id: string;
          profile_id: string;
          week_starting: string;
          shift_data: Record<string, Record<string, boolean>>;
          status: 'pending' | 'approved';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          week_starting: string;
          shift_data: Record<string, Record<string, boolean>>;
          status?: 'pending' | 'approved';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          week_starting?: string;
          shift_data?: Record<string, Record<string, boolean>>;
          status?: 'pending' | 'approved';
          created_at?: string;
          updated_at?: string;
        };
      };
      time_off_requests: {
        Row: {
          id: string;
          profile_id: string;
          start_date: string;
          end_date: string;
          status: 'pending' | 'approved' | 'denied';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          start_date: string;
          end_date: string;
          status?: 'pending' | 'approved' | 'denied';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          start_date?: string;
          end_date?: string;
          status?: 'pending' | 'approved' | 'denied';
          created_at?: string;
          updated_at?: string;
        };
      };
      capacity_settings: {
        Row: {
          id: string;
          week_starting: string;
          rules: {
            capacity: Record<string, Record<string, number>>;
            holiday_overrides: Record<string, Record<string, number>>;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_starting: string;
          rules: {
            capacity: Record<string, Record<string, number>>;
            holiday_overrides: Record<string, Record<string, number>>;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week_starting?: string;
          rules?: {
            capacity: Record<string, Record<string, number>>;
            holiday_overrides: Record<string, Record<string, number>>;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
