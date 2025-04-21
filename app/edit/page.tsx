'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Search, Trash2 } from 'lucide-react';
import { Flashcard } from '@/types/database';
import Navbar from '@/components/Navbar';
import FlashcardEditCard from '@/components/FlashcardEditCard';
import { getSupabaseClient } from '@/utils/supabase/supabase-client';

// Helper function to normalize text by removing diacritical marks
const normalizeText = (text: string) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export default function EditPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlashcards, setSelectedFlashcards] = useState<string[]>([]);
  const [mode, setMode] = useState<'edit' | 'select'>('edit');

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;

      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = await getSupabaseClient(token);
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching flashcards:', error);
          throw error;
        }
        
        setFlashcards(data || []);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [user, getToken]);

  const handleEdit = async (id: string, updates: Partial<Flashcard>) => {
    if (!user) return;

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id)
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      // Update local state
      setFlashcards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates } : card
      ));
    } catch (error) {
      console.error('Error updating flashcard:', error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!user || ids.length === 0) return;

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .in('id', ids)
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      // Update local state
      setFlashcards(prev => prev.filter(card => !ids.includes(card.id)));
      setSelectedFlashcards([]);
    } catch (error) {
      console.error('Error deleting flashcards:', error);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    await handleDelete([id]);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSelect = (id: string) => {
    setSelectedFlashcards(prev => 
      prev.includes(id) 
        ? prev.filter(cardId => cardId !== id)
        : [...prev, id]
    );
  };

  const filteredFlashcards = flashcards.filter(card => 
    normalizeText(card.tongan_phrase).includes(normalizeText(searchQuery)) ||
    normalizeText(card.english_phrase).includes(normalizeText(searchQuery))
  );

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-pulse text-lg">Loading flashcards...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="sticky top-[0px] bg-[var(--background)] py-4 px-2 mb-4 z-[1] rounded-b-xl">
          
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h1 className="text-4xl font-bold">Edit your flashcards</h1>
            <div className="flex flex-row items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search flashcards"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent w-full"
                />
              </div>
              <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => {
                    setMode('edit');
                    setSelectedFlashcards([]);
                  }}
                  className={`px-3 py-1 rounded ${
                    mode === 'edit'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setMode('select');
                    setSelectedFlashcards([]);
                  }}
                  className={`px-3 py-1 rounded ${
                    mode === 'select'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Select
                </button>
              </div>
            </div>
          </div>
          {mode === 'select' && (
            <div className="flex items-center gap-2 mt-2">
              <span>{selectedFlashcards.length} selected</span>
              <button
                onClick={() => setSelectedFlashcards(filteredFlashcards.map(card => card.id))}
                className="text-[var(--primary)] hover:underline"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedFlashcards([])}
                className="text-[var(--primary)] hover:underline"
              >
                Deselect all
              </button>
              {selectedFlashcards.length > 0 && (
                <button
                  onClick={() => handleDelete(selectedFlashcards)}
                  className="text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlashcards.map(card => (
            <FlashcardEditCard
              key={card.id}
              card={card}
              isSelected={selectedFlashcards.includes(card.id)}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDeleteSingle}
              allCards={filteredFlashcards}
              mode={mode}
            />
          ))}
        </div>

        {filteredFlashcards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No flashcards found</p>
          </div>
        )}
      </div>
    </main>
  );
}
