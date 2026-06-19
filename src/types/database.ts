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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "progress_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      work_plans: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          game_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          game_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          game_ids?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_plans_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          }
        ];
      };
      work_plan_classes: {
        Row: {
          plan_id: string;
          class_id: string;
        };
        Insert: {
          plan_id: string;
          class_id: string;
        };
        Update: {
          plan_id?: string;
          class_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_plan_classes_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "work_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_plan_classes_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
