import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables are not set');
      return null;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
};

export const supabase = getSupabase();

export interface Student {
  name: string;
  preferFront: boolean;
}

export interface SeatLayout {
  rows: number;
  cols: number;
  disabled: number[];
}

export interface ClassroomTemplate {
  id: string;
  class_code: string;
  seat_layout: SeatLayout;
  students: Student[];
  created_at: string;
  updated_at: string;
}
