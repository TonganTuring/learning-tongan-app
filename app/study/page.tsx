'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RatingButton from '@/components/RatingButton';
import StatusIndicator from '@/components/StatusIndicator';
import FlashcardSettings from '@/components/FlashcardSettings';
import { getSupabaseClient } from '@/utils/supabase/supabase-client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Flashcard } from '@/types/database';
import { useSwipeable } from 'react-swipeable';

export default function StudyPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'random'>('newest');
  const [statusFilter, setStatusFilter] = useState<('good' | 'ok' | 'bad' | 'none')[]>(['good', 'ok', 'bad', 'none']);
  const [showHidden, setShowHidden] = useState(false);
  const [swapQA, setSwapQA] = useState(false);
  const [showUserTags, setShowUserTags] = useState(false);

  // Add animation state and motion values
  const [isAnimating, setIsAnimating] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  // Move filteredAndSortedFlashcards declaration before the useEffect
  const filteredAndSortedFlashcards = useMemo(() => {
    let filtered = [...flashcards];
    console.log('Initial flashcards:', flashcards);
    console.log('Current sort:', sortBy);

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(card => statusFilter.includes(card?.status || 'none'));
    }
    console.log('After status filter:', filtered);

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        console.log('Sorting newest:', { a: a.created_at, b: b.created_at });
        if (!a.created_at) return -1;
        if (!b.created_at) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => {
        console.log('Sorting oldest:', { a: a.created_at, b: b.created_at });
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else if (sortBy === 'random') {
      // Only shuffle when the filtered cards change or when switching to random sort
      if (shuffledOrder.length !== filtered.length) {
        const newOrder = Array.from({ length: filtered.length }, (_, i) => i);
        // Fisher-Yates shuffle algorithm
        for (let i = newOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
        }
        setShuffledOrder(newOrder);
      }
      // Apply the shuffled order
      filtered = shuffledOrder.map(index => filtered[index]);
    }

    console.log('Final sorted cards:', filtered);
    return filtered;
  }, [flashcards, statusFilter, sortBy, shuffledOrder]);

  // Reset current index if there are no cards matching the filter
  useEffect(() => {
    if (filteredAndSortedFlashcards.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= filteredAndSortedFlashcards.length) {
      setCurrentIndex(filteredAndSortedFlashcards.length - 1);
    }
  }, [filteredAndSortedFlashcards.length, currentIndex]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;

      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = await getSupabaseClient(token);
        const { data, error } = await supabase
          .from('flashcards')
          .select('id, tongan_phrase, english_phrase, status, created_at, last_reviewed_at, clerk_user_id')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching flashcards:', error);
          throw error;
        }
        
        console.log('Fetched flashcards:', data);
        setFlashcards(data || []);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [user, getToken]);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!filteredAndSortedFlashcards.length) return;

      if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === '1') {
        updateFlashcardStatus('bad');
      } else if (event.key === '2') {
        updateFlashcardStatus('ok');
      } else if (event.key === '3') {
        updateFlashcardStatus('good');
      } else if (event.key === ' ') {
        event.preventDefault(); // Prevent page scroll
        setShowAnswer(prev => !prev); // Toggle answer visibility
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredAndSortedFlashcards]); // Add filteredAndSortedFlashcards as dependency

  const handleNext = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % filteredAndSortedFlashcards.length);
  }, [filteredAndSortedFlashcards.length]);

  const handlePrevious = useCallback(() => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + filteredAndSortedFlashcards.length) % filteredAndSortedFlashcards.length);
  }, [filteredAndSortedFlashcards.length]);

  const updateFlashcardStatus = async (status: 'good' | 'bad' | 'ok') => {
    if (!user || !filteredAndSortedFlashcards[currentIndex]) return;

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('flashcards')
        .update({
          status,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', filteredAndSortedFlashcards[currentIndex].id)
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      // Update local state
      setFlashcards(prev => prev.map(card => 
        card.id === filteredAndSortedFlashcards[currentIndex].id 
          ? { ...card, status }
          : card
      ));

      // Move to next card
      handleNext();
    } catch (error) {
      console.error('Error updating flashcard status:', error);
    }
  };

  // Modify swipe handlers to include animation
  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!isAnimating) {
        // Only update position if horizontal movement is significantly greater than vertical
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 30) {
          x.set(e.deltaX);
        } else {
          x.set(0);
        }
      }
    },
    onSwipedLeft: (e) => {
      // Only trigger if horizontal movement is significantly greater than vertical
      if (!isAnimating && Math.abs(e.deltaX) > 100 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        setDirection('left');
        setIsAnimating(true);
        // Immediately start the exit animation
        x.set(-100);
        // Navigate after a short delay to ensure the exit animation is visible
        setTimeout(() => {
          handleNext();
          // Reset animation state after navigation
          setTimeout(() => {
            setIsAnimating(false);
            setDirection(null);
            x.set(0);
          }, 300);
        }, 200);
      } else {
        // Reset position if swipe wasn't intentional
        x.set(0);
      }
    },
    onSwipedRight: (e) => {
      // Only trigger if horizontal movement is significantly greater than vertical
      if (!isAnimating && Math.abs(e.deltaX) > 100 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        setDirection('right');
        setIsAnimating(true);
        // Immediately start the exit animation
        x.set(100);
        // Navigate after a short delay to ensure the exit animation is visible
        setTimeout(() => {
          handlePrevious();
          // Reset animation state after navigation
          setTimeout(() => {
            setIsAnimating(false);
            setDirection(null);
            x.set(0);
          }, 300);
        }, 200);
      } else {
        // Reset position if swipe wasn't intentional
        x.set(0);
      }
    },
    onSwiped: () => {
      if (!isAnimating) {
        x.set(0);
      }
    },
    trackMouse: true,
    trackTouch: true,
    delta: 30
  });

  // Add effect to reset animation state when currentIndex changes
  useEffect(() => {
    setIsAnimating(false);
    setDirection(null);
    x.set(0);
  }, [currentIndex, x]);

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

  if (!flashcards.length) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-lg">No flashcards found. Create some flashcards to start studying!</p>
        </div>
      </main>
    );
  }

  const currentCard = filteredAndSortedFlashcards[currentIndex];

  return (
    <main className="h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4" {...swipeHandlers}>
        {/* Progress bar and settings button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-4">
            <div className="flex h-full">
              <div 
                className="bg-green-500/70 h-full transition-all"
                style={{ 
                  width: `${(flashcards.filter(card => card.status === 'good').length / flashcards.length) * 100}%` 
                }}
              />
              <div 
                className="bg-yellow-500/70 h-full transition-all"
                style={{ 
                  width: `${(flashcards.filter(card => card.status === 'ok').length / flashcards.length) * 100}%` 
                }}
              />
              <div 
                className="bg-red-500/70 h-full transition-all"
                style={{ 
                  width: `${(flashcards.filter(card => card.status === 'bad').length / flashcards.length) * 100}%` 
                }}
              />
              <div 
                className="bg-gray-300/40 h-full transition-all"
                style={{ 
                  width: `${(flashcards.filter(card => card.status === 'none').length / flashcards.length) * 100}%` 
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--beige)]"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {filteredAndSortedFlashcards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-lg text-center mb-4">No flashcards found with the selected status filter.</p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/90"
            >
              Adjust Filter Settings
            </button>
          </div>
        ) : (
          <>
            {/* Current position indicator */}
            <div className="mb-2 text-sm text-center text-gray-600">
              Card {currentIndex + 1} of {filteredAndSortedFlashcards.length}
            </div>

            {/* Flashcard container with navigation */}
            <div className="relative flex items-center flex-1 px-4 md:px-0">
              {/* Navigation button - Previous */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 lg:-left-20 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50 z-10"
                aria-label="Previous Card"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Flashcard Container */}
              <div className="relative w-full overflow-hidden h-full">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${currentIndex}-${filteredAndSortedFlashcards[currentIndex]?.id}`}
                    style={{ x, opacity }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-white rounded-xl shadow-lg p-8 sm:p-12 flex flex-col items-center justify-center text-center w-full h-full"
                  >
                    <div className="absolute top-4 left-4">
                      <StatusIndicator status={currentCard.status} size="lg" />
                    </div>
                    
                    <h2 className="text-3xl mb-8">
                      {swapQA ? currentCard.english_phrase : currentCard.tongan_phrase}
                    </h2>
                    
                    {showAnswer ? (
                      <div className="h-[1px] w-full bg-gray-400 mb-8">
                        <p className="text-xl pt-6">
                          {swapQA ? currentCard.tongan_phrase : currentCard.english_phrase}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="primary-button"
                      >
                        Show Answer
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation button - Next */}
              <button
                onClick={handleNext}
                className="absolute right-0 lg:-right-20 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50 z-10"
                aria-label="Next Card"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Rating buttons in separate container */}
            <div className="flex justify-center gap-6 py-4">
              <RatingButton
                type="bad"
                onClick={() => updateFlashcardStatus('bad')}
                currentStatus={currentCard.status}
              />
              <RatingButton
                type="ok"
                onClick={() => updateFlashcardStatus('ok')}
                currentStatus={currentCard.status}
              />
              <RatingButton
                type="good"
                onClick={() => updateFlashcardStatus('good')}
                currentStatus={currentCard.status}
              />
            </div>
          </>
        )}

        {/* Add FlashcardSettings component */}
        <FlashcardSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentSort={sortBy}
          currentStatusFilter={statusFilter}
          swapQA={swapQA}
          onSortChange={setSortBy}
          onStatusFilterChange={setStatusFilter}
          onSwapQAChange={setSwapQA}
        />
      </div>
    </main>
  );
}
