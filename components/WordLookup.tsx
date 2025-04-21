import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/utils/supabase/supabase-client';
import type { Database } from '@/types/database';

// Define the valid status values
type FlashcardStatus = 'none' | 'good' | 'bad' | 'ok';

type WordLookupProps = {
  word: string;
  position: { x: number; y: number } | null;
  onClose: () => void;
};

type DictionaryEntry = {
  tongan: string;
  english: string;
};

type FlashcardEntry = {
  tongan_phrase: string;
  english_phrase: string;
  status: FlashcardStatus;
  last_reviewed_at: string | null;
};

export default function WordLookup({ word, position, onClose }: WordLookupProps) {
  console.log('=== WORDLOOKUP COMPONENT START ===');
  console.log('Initial props:', { word, position });
  
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingFlashcard, setIsAddingFlashcard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEnglish, setEditedEnglish] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasExistingFlashcard, setHasExistingFlashcard] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    console.log('=== WORDLOOKUP MOUNT EFFECT ===');
    mountedRef.current = true;
    console.log('Component mounted with ref:', mountedRef.current);
    return () => {
      mountedRef.current = false;
      console.log('Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('=== WORDLOOKUP USER EFFECT ===');
    console.log('User state:', { isSignedIn, userId: user?.id });
  }, [isSignedIn, user]);

  useEffect(() => {
    console.log('=== WORDLOOKUP WORD EFFECT ===');
    console.log('Word changed:', word);
    console.log('Position:', position);
    
    // Clear any existing errors when word changes
    setError(null);
    setHasExistingFlashcard(false);
    
    const fetchDefinition = async () => {
      try {
        setLoading(true);
        
        // First check if user has a flashcard for this word
        if (isSignedIn && user?.id) {
          console.log('Checking for existing flashcard...');
          const token = await getToken({ template: 'supabase' });
          if (token) {
            const supabase = await getSupabaseClient(token);
            const { data: flashcard, error: flashcardError } = await supabase
              .from('flashcards')
              .select('*')
              .eq('clerk_user_id', user.id)
              .eq('tongan_phrase', word)
              .single();

            if (!flashcardError && flashcard) {
              console.log('Found existing flashcard:', flashcard);
              setDefinition({
                tongan: flashcard.tongan_phrase,
                english: flashcard.english_phrase
              });
              setEditedEnglish(flashcard.english_phrase);
              setHasExistingFlashcard(true);
              setLoading(false);
              return;
            }
          }
        }

        // If no flashcard found, check dictionary
        console.log('No flashcard found, checking dictionary...');
        const response = await fetch('/api/dictionary?word=' + encodeURIComponent(word));
        console.log('API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('API response data:', data);
        setDefinition(data);
        setEditedEnglish(data.english);
      } catch (error) {
        console.error('Error fetching definition:', error);
        setDefinition(null);
      } finally {
        setLoading(false);
      }
    };

    if (word && position) {
      console.log('Word and position available, fetching definition');
      setIsEditing(false);
      fetchDefinition();
    } else {
      console.log('Word or position missing, skipping fetch');
    }
  }, [word, isSignedIn, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAddFlashcard = async () => {
    console.log('=== Starting handleAddFlashcard ===');
    console.log('Initial state:', {
      isSignedIn,
      userId: user?.id,
      hasDefinition: !!definition,
      isAddingFlashcard,
      word,
      definition
    });

    if (!isSignedIn) {
      console.log('User not signed in, redirecting to sign-in');
      router.push('/sign-in');
      onClose();
      return;
    }

    if (!definition) {
      console.log('No definition available');
      setError('No definition available');
      return;
    }

    try {
      setIsAddingFlashcard(true);
      console.log('Getting authenticated Supabase client...');
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        console.error('Failed to get authentication token');
        setError('Authentication error');
        return;
      }
      console.log('Got token:', token);
      const supabase = await getSupabaseClient(token);
      
      if (!user?.id) {
        console.error('No user ID found despite being signed in');
        setError('User authentication error');
        return;
      }

      // Create flashcard with Clerk user ID
      console.log('Creating flashcard with Clerk user ID:', user.id);
      const { error: flashcardError } = await supabase
        .from('flashcards')
        .insert({
          tongan_phrase: word,
          english_phrase: definition.english,
          clerk_user_id: user.id,
          status: 'none' as FlashcardStatus,
          last_reviewed_at: null
        });

      console.log('Flashcard creation result:', { flashcardError });

      if (flashcardError) {
        console.error('Failed to create flashcard:', flashcardError);
        setError(`Failed to create flashcard: ${flashcardError.message}`);
        return;
      }

      console.log('Flashcard created successfully!');
      onClose();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError(error?.message || 'An unexpected error occurred');
    } finally {
      setIsAddingFlashcard(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (definition) {
      setDefinition({
        ...definition,
        english: editedEnglish
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (definition) {
      setEditedEnglish(definition.english);
    }
    setIsEditing(false);
  };

  if (!position || !word) return null;

  // Calculate position to keep popup within viewport
  let { x, y } = position;
  if (popupRef.current) {
    const rect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }
  }

  return (
    <div
      ref={popupRef}
      className="fixed bg-white border border-black rounded-xl p-4 min-w-[200px] max-w-[300px] z-50"
      style={{ 
        left: `${x}px`,
        top: `${y}px`
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-xl whitespace-pre-wrap break-words">{word}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--beige)] rounded-full"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : definition ? (
        <div>
          {hasExistingFlashcard && (
            <p className="text-xs text-gray-500 mb-2">(already in your flashcards)</p>
          )}
          {isEditing ? (
            <textarea
              value={editedEnglish}
              onChange={(e) => setEditedEnglish(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={3}
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-600">{definition.english}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No definition found</p>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {isEditing ? (
          <>
            <button 
              className="primary-button flex-1"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button 
              className="primary-button flex-1"
              onClick={handleAddFlashcard}
              disabled={isAddingFlashcard}
              style={{ opacity: isAddingFlashcard ? 0.5 : 1 }}
            >
              {isAddingFlashcard ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button 
              className="primary-button flex-1"
              onClick={handleEdit}
              disabled={!definition}
            >
              Edit
            </button>
            <button 
              className="primary-button flex-1"
              onClick={handleAddFlashcard}
              disabled={isAddingFlashcard || !definition}
              style={{ opacity: (isAddingFlashcard || !definition) ? 0.5 : 1 }}
            >
              {isAddingFlashcard ? 'Adding...' : hasExistingFlashcard ? 'Update' : 'Add'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 