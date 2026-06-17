export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          first_name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          first_name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          first_name?: string;
          code?: string;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          title: string;
          type: string;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          config: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: string;
          config?: Json;
          created_at?: string;
        };
      };
      progress: {
        Row: {
          id: string;
          student_id: string;
          game_id: string;
          score: number;
          played_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          game_id: string;
          score: number;
          played_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          game_id?: string;
          score?: number;
          played_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
