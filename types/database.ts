export type User = {
  email: string;
  created_at: string;
  current_book: string | null;
  current_chapter: number | null;
}

export type Flashcard = {
  id: string;
  created_at: string;
  tongan_phrase: string;
  english_phrase: string;
  last_reviewed_at: string | null;
  status: 'none' | 'good' | 'bad' | 'ok';
  user_id: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'created_at'>>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, 'created_at' | 'id'>;
        Update: Partial<Omit<Flashcard, 'created_at' | 'id'>>;
      };
    };
  };
} 