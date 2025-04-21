'use client';

console.log('=== BIBLE PAGE LOADED ===');

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback, useRef, Suspense, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Type, Columns, Bookmark, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { useUser } from '@clerk/nextjs';
import { getSupabaseClient } from '@/utils/supabase/supabase-client';
import { useAuth } from '@clerk/nextjs';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// Lazy load components
const BookSelector = dynamic(() => import('@/components/BookSelector'), {
  loading: () => <div className="fixed bottom-21 left-1/2 -translate-x-1/2 bg-[var(--background)] border border-black-100 rounded-lg shadow-lg z-50 w-[80%] max-w-sm h-[50vh] overflow-hidden animate-pulse" />
});

const ReaderSettings = dynamic(() => import('@/components/ReaderSettings'), {
  loading: () => <div className="fixed bottom-21 left-1/2 -translate-x-1/2 bg-[var(--background)] border border-black-100 rounded-lg shadow-lg z-50 w-[70%] max-w-xs overflow-hidden animate-pulse" />
});

// Add WordLookup import
const WordLookup = dynamic(() => {
  console.log('=== DYNAMIC IMPORT START ===');
  return import('@/components/WordLookup').then(module => {
    console.log('=== DYNAMIC IMPORT SUCCESS ===');
    return module.default;
  }).catch(error => {
    console.error('=== DYNAMIC IMPORT ERROR ===', error);
    throw error;
  });
}, {
  loading: () => {
    console.log('=== WORDLOOKUP LOADING ===');
    return null;
  },
  ssr: false
});

// Import the Bible data
import esvBible from '@/public/bibles/esv_bible.json';
import tonganBible from '@/public/bibles/tongan_bible.json';

type Verse = {
  number: string;
  text: string;
};

type Chapter = Verse[];

type BibleBook = {
  name: string;
  chapters: {
    [key: string]: Chapter;
  };
};

type Bible = {
  [key: string]: BibleBook;
};

type ProcessedVerse = {
  number: string;
  text: string;
  key: string;
};

export default function BiblePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const book = (params.book as string).toUpperCase();
  const chapter = params.chapter as string;
  
  // Memoize the Bible data
  const memoizedEsvBible = useMemo(() => esvBible as Bible, []);
  const memoizedTonganBible = useMemo(() => tonganBible as Bible, []);

  // Memoize the processVerses function
  const memoizedProcessVerses = useCallback((verses: Verse[]): ProcessedVerse[] => {
    const processed: ProcessedVerse[] = [];
    let currentVerse: ProcessedVerse | null = null;

    verses.forEach((verse, index) => {
      if (verse.number === '#') {
        if (currentVerse) {
          currentVerse.text = `${currentVerse.text} ${verse.text}`;
        }
      } else {
        if (currentVerse) {
          processed.push(currentVerse);
        }
        currentVerse = {
          number: verse.number,
          text: verse.text,
          key: `verse-${index}`
        };
      }
    });

    if (currentVerse) {
      processed.push(currentVerse);
    }

    return processed;
  }, []);

  // Memoize the getPreviousBookLastChapter function
  const memoizedGetPreviousBookLastChapter = useCallback((currentBook: string): { book: string; chapter: string } | null => {
    const books = Object.keys(memoizedEsvBible);
    const currentIndex = books.indexOf(currentBook);
    
    if (currentIndex <= 0) return null;
    
    const prevBook = books[currentIndex - 1];
    const prevBookChapters = Object.keys(memoizedEsvBible[prevBook].chapters);
    const lastChapter = prevBookChapters[prevBookChapters.length - 1];
    
    return {
      book: prevBook.toLowerCase(),
      chapter: lastChapter
    };
  }, [memoizedEsvBible]);

  // Memoize the getNextBookFirstChapter function
  const memoizedGetNextBookFirstChapter = useCallback((currentBook: string): { book: string; chapter: string } | null => {
    const books = Object.keys(memoizedEsvBible);
    const currentIndex = books.indexOf(currentBook);
    
    if (currentIndex >= books.length - 1) return null;
    
    const nextBook = books[currentIndex + 1];
    
    return {
      book: nextBook.toLowerCase(),
      chapter: '1'
    };
  }, [memoizedEsvBible]);

  const [isParallel, setIsParallel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parallelMode');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const [isBookSelectorOpen, setIsBookSelectorOpen] = useState(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSize');
      return (saved as 'small' | 'medium' | 'large') || 'small';
    }
    return 'small';
  });
  
  // Memoize processed chapters
  const { esvChapter, tonganChapter } = useMemo(() => {
    return {
      esvChapter: memoizedProcessVerses(memoizedEsvBible[book]?.chapters?.[chapter] || []),
      tonganChapter: memoizedProcessVerses(memoizedTonganBible[book]?.chapters?.[chapter] || [])
    };
  }, [book, chapter, memoizedProcessVerses, memoizedEsvBible, memoizedTonganBible]);
  
  // Add state for word lookup
  const [selectedWord, setSelectedWord] = useState('');
  const [wordPosition, setWordPosition] = useState<{ x: number; y: number } | null>(null);

  // Add state for bookmark status
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [currentBook, setCurrentBook] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<number | null>(null);

  // Add animation state and motion values
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  // Add effect to load current verse on mount
  useEffect(() => {
    const loadCurrentVerse = async () => {
      if (!user) return;
      
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = await getSupabaseClient(token);
        const { data, error } = await supabase
          .from('users')
          .select('current_verse, current_book, current_chapter')
          .eq('clerk_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setCurrentVerse(data.current_verse);
          setCurrentBook(data.current_book);
          setCurrentChapter(data.current_chapter);
        }
      } catch (error) {
        console.error('Error loading current verse:', error);
      }
    };

    loadCurrentVerse();
  }, [user, getToken]);

  // Add effect to monitor state changes
  useEffect(() => {
    console.log('=== WORD LOOKUP STATE CHANGED ===');
    console.log('Selected word:', selectedWord);
    console.log('Word position:', wordPosition);
  }, [selectedWord, wordPosition]);

  // Add refs for timeout
  const bookSelectorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readerSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add hover state handlers with delay
  const handleBookSelectorHover = useCallback((isHovering: boolean) => {
    if (bookSelectorTimeoutRef.current) {
      clearTimeout(bookSelectorTimeoutRef.current);
    }
    
    if (isHovering) {
      setIsReaderSettingsOpen(false);
      setIsBookSelectorOpen(true);
    } else {
      bookSelectorTimeoutRef.current = setTimeout(() => {
        // Let the component handle its own closing animation
        setIsBookSelectorOpen(false);
      }, 200); // 200ms delay before closing
    }
  }, []);

  const handleReaderSettingsHover = useCallback((isHovering: boolean) => {
    if (readerSettingsTimeoutRef.current) {
      clearTimeout(readerSettingsTimeoutRef.current);
    }
    
    if (isHovering) {
      setIsBookSelectorOpen(false);
      setIsReaderSettingsOpen(true);
    } else {
      readerSettingsTimeoutRef.current = setTimeout(() => {
        // Let the component handle its own closing animation
        setIsReaderSettingsOpen(false);
      }, 200); // 200ms delay before closing
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (bookSelectorTimeoutRef.current) {
        clearTimeout(bookSelectorTimeoutRef.current);
      }
      if (readerSettingsTimeoutRef.current) {
        clearTimeout(readerSettingsTimeoutRef.current);
      }
    };
  }, []);

  if (!esvChapter.length || !tonganChapter.length) {
    return <div className="p-6">Chapter not found</div>;
  }

  // Memoize navigation links
  const { prevLink, nextLink } = useMemo(() => {
    const prevChapter = parseInt(chapter) - 1;
    const nextChapter = parseInt(chapter) + 1;
    
    const prevBookLastChapter = memoizedGetPreviousBookLastChapter(book);
    const nextBookFirstChapter = memoizedGetNextBookFirstChapter(book);
    
    return {
      prevLink: prevChapter >= 1 
        ? `/bible/${book.toLowerCase()}/${prevChapter}`
        : prevBookLastChapter 
          ? `/bible/${prevBookLastChapter.book}/${prevBookLastChapter.chapter}`
          : null,
      nextLink: memoizedEsvBible[book]?.chapters?.[nextChapter.toString()]
        ? `/bible/${book.toLowerCase()}/${nextChapter}`
        : nextBookFirstChapter
          ? `/bible/${nextBookFirstChapter.book}/${nextBookFirstChapter.chapter}`
          : null
    };
  }, [book, chapter, memoizedGetPreviousBookLastChapter, memoizedGetNextBookFirstChapter, memoizedEsvBible]);

  const handleBookSelect = useCallback((selectedBook: string) => {
    const [book, chapter] = selectedBook.split('/');
    router.push(`/bible/${book.toLowerCase()}/${chapter}`);
  }, [router]);

  const handleParallelToggle = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      const newValue = !isParallel;
      setIsParallel(newValue);
      localStorage.setItem('parallelMode', String(newValue));
      setIsVisible(true);
    }, 200);
  }, [isParallel]);

  const handleFontSizeChange = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
  }, []);

  const getFontSizeClass = useCallback(() => {
    switch (fontSize) {
      case 'small':
        return 'text-base';
      case 'medium':
        return 'text-lg';
      case 'large':
        return 'text-xl';
    }
  }, [fontSize]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: esvChapter.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
    measureElement: (element) => {
      if (!element) return 80;
      
      // Get the actual height of the entire row element
      const rowHeight = element.getBoundingClientRect().height;
      
      // Add a more generous buffer to prevent any overlap
      return rowHeight + 16;
    },
  });

  // Add word click handler
  const handleWordClick = (event: React.MouseEvent<HTMLSpanElement>, word: string) => {
    try {
      window.console.log('=== WORD CLICK HANDLER START ===');
      window.console.log('Raw word clicked:', word);
      window.console.log('Event details:', {
        clientX: event.clientX,
        clientY: event.clientY,
        target: event.target,
        currentTarget: event.currentTarget
      });
      
      event.preventDefault();
      event.stopPropagation();
      
      // Clean the word by removing punctuation but preserve apostrophes
      const cleanWord = word
        .replace(/[.,!?;:"\u201C\u201D]/g, '') // Remove quotes and other punctuation but keep apostrophes
        .trim();
      
      window.console.log('Cleaned word:', cleanWord);
      window.console.log('Setting state with:', {
        word: cleanWord,
        position: { x: event.clientX, y: event.clientY }
      });
      
      setSelectedWord(cleanWord);
      setWordPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      window.console.log('=== WORD CLICK HANDLER END ===');
    } catch (error) {
      window.console.error('Error in handleWordClick:', error);
    }
  };

  // Add close handler
  const handleCloseWordLookup = () => {
    console.log('=== CLOSING WORD LOOKUP ===');
    setSelectedWord('');
    setWordPosition(null);
  };

  // Add keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && prevLink) {
      router.push(prevLink);
    } else if (event.key === 'ArrowRight' && nextLink) {
      router.push(nextLink);
    }
  }, [prevLink, nextLink, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Add verse click handler
  const handleVerseClick = async (verseNumber: number) => {
    if (!user) return;
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('users')
        .update({
          current_verse: verseNumber,
          current_book: book,
          current_chapter: parseInt(chapter)
        })
        .eq('clerk_id', user.id);

      if (error) throw error;
      
      setCurrentVerse(verseNumber);
      setCurrentBook(book);
      setCurrentChapter(parseInt(chapter));
    } catch (error) {
      console.error('Error saving current verse:', error);
    }
  };

  // Modify the verse rendering to make verse numbers clickable and highlight current verse
  const renderVerseNumber = (number: string, isTongan: boolean = false) => {
    const verseNum = parseInt(number);
    const isCurrentVerse = currentVerse === verseNum;
    
    return (
      <span 
        className={`font-semibold text-xs mr-1 min-w-[2rem] text-right shrink-0 ${
          user ? 'cursor-pointer hover:text-[var(--primary)]' : ''
        } ${
          isCurrentVerse ? 'text-[var(--primary)] font-bold text-sm' : 'opacity-70'
        }`}
        onClick={user ? () => handleVerseClick(verseNum) : undefined}
      >
        {number}
      </span>
    );
  };

  // Modify the verse rendering to make words clickable
  const renderTonganText = (text: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.console.log('Rendering Tongan text:', text);
      }
      return text.split(' ').map((word, index, array) => (
        <span key={index}>
          <span
            className="cursor-pointer hover:text-[var(--primary)] rounded px-0.5"
            onClick={(e) => {
              try {
                if (typeof window !== 'undefined') {
                  window.console.log('Word span clicked:', word);
                }
                handleWordClick(e, word);
              } catch (error) {
                if (typeof window !== 'undefined') {
                  window.console.error('Error in word click:', error);
                }
              }
            }}
          >
            {word}
          </span>
          {index < array.length - 1 ? ' ' : ''}
        </span>
      ));
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.console.error('Error in renderTonganText:', error);
      }
      return null;
    }
  };

  // Add bookmark handler
  const handleBookmark = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const supabase = await getSupabaseClient(token);
      const { error } = await supabase
        .from('users')
        .update({
          current_book: book,
          current_chapter: parseInt(chapter)
        })
        .eq('clerk_id', user.id);

      if (error) throw error;
      
      setIsBookmarked(true);
      // Reset bookmark status after 2 seconds
      setTimeout(() => setIsBookmarked(false), 2000);
    } catch (error) {
      console.error('Error saving bookmark:', error);
    } finally {
      setIsSaving(false);
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
      if (nextLink && !isAnimating && Math.abs(e.deltaX) > 100 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        setDirection('left');
        setIsAnimating(true);
        // Immediately start the exit animation
        x.set(-100);
        // Navigate after a short delay to ensure the exit animation is visible
        setTimeout(() => {
          router.push(nextLink);
          // Reset animation state after navigation
          setTimeout(() => {
            setIsAnimating(false);
            setDirection(null);
            x.set(0);
          }, 100);
        }, 200);
      } else {
        // Reset position if swipe wasn't intentional
        x.set(0);
      }
    },
    onSwipedRight: (e) => {
      // Only trigger if horizontal movement is significantly greater than vertical
      if (prevLink && !isAnimating && Math.abs(e.deltaX) > 100 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
        setDirection('right');
        setIsAnimating(true);
        // Immediately start the exit animation
        x.set(100);
        // Navigate after a short delay to ensure the exit animation is visible
        setTimeout(() => {
          router.push(prevLink);
          // Reset animation state after navigation
          setTimeout(() => {
            setIsAnimating(false);
            setDirection(null);
            x.set(0);
          }, 100);
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
    delta: 30 // Increased minimum distance before swipe is registered
  });

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-0 sm:p-6 pb-24 flex-1 w-full" {...swipeHandlers}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${book}-${chapter}`}
            style={{ x, opacity }}
            initial={{ 
              x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
              opacity: 0 
            }}
            animate={{ 
              x: 0,
              opacity: 1 
            }}
            exit={{ 
              x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
              opacity: 0 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2
            }}
            className="relative"
          >
            <div 
              className="relative"
              onMouseEnter={() => handleBookSelectorHover(true)}
              onMouseLeave={() => handleBookSelectorHover(false)}
            >
              <BookSelector
                isOpen={isBookSelectorOpen}
                onClose={() => setIsBookSelectorOpen(false)}
                onSelectBook={handleBookSelect}
              />
            </div>

            <div 
              className="relative"
              onMouseEnter={() => handleReaderSettingsHover(true)}
              onMouseLeave={() => handleReaderSettingsHover(false)}
            >
              <ReaderSettings
                isOpen={isReaderSettingsOpen}
                onClose={() => setIsReaderSettingsOpen(false)}
                onFontSizeChange={handleFontSizeChange}
              />
            </div>

            <WordLookup
              word={selectedWord}
              position={wordPosition}
              onClose={handleCloseWordLookup}
            />
          
            <div className="flex justify-center items-center mb-6 mt-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-center">
                {memoizedTonganBible[book]?.name} {chapter}
              </h1>
            </div>
            
            <div className="px-0 sm:px-4">
              {esvChapter.map((verse, index) => {
                const tonganVerse = tonganChapter.find(v => v.number === verse.number);
                const tonganRangeVerse = tonganChapter.find(v => {
                  if (!v.number.includes('-')) return false;
                  const [start, end] = v.number.split('-').map(Number);
                  return parseInt(verse.number) >= start && parseInt(verse.number) <= end;
                });

                const currentVerseNum = parseInt(verse.number);
                if (tonganRangeVerse && currentVerseNum > parseInt(tonganRangeVerse.number.split('-')[0])) {
                  return null;
                }

                let combinedEnglishVerses = [];
                if (tonganRangeVerse) {
                  const [start, end] = tonganRangeVerse.number.split('-').map(Number);
                  for (let i = start; i <= end; i++) {
                    const rangeVerse = esvChapter.find(v => parseInt(v.number) === i);
                    if (rangeVerse) {
                      combinedEnglishVerses.push(rangeVerse);
                    }
                  }
                }

                const isCurrentVerse = currentVerse === currentVerseNum && 
                                     book === currentBook && 
                                     parseInt(chapter) === currentChapter;

                return (
                  <div 
                    key={verse.number} 
                    className={`flex flex-row mb-4 rounded-lg transition-all duration-200 gap-1 sm:gap-4 ${
                      isCurrentVerse ? 'bg-white p-3 sm:p-4 -mx-2 sm:-mx-4 border border-[var(--primary)]/20 shadow-sm' : ''
                    }`}
                  >
                    {isParallel && (
                      <div className="flex-1 pr-1 sm:pr-4 min-w-[45%] -mx-1 sm:mx-0">
                        {combinedEnglishVerses.length > 0 ? (
                          <div>
                            {combinedEnglishVerses.map((englishVerse) => (
                              <div key={`combined-${englishVerse.number}`} className="flex">
                                {renderVerseNumber(englishVerse.number)}
                                <span className={`${getFontSizeClass()} ${isCurrentVerse ? 'font-medium' : ''}`}>
                                  {englishVerse.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex">
                            {renderVerseNumber(verse.number)}
                            <span className={`${getFontSizeClass()} ${isCurrentVerse ? 'font-medium' : ''}`}>
                              {verse.text}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={isParallel ? 'flex-1 min-w-[45%] -ml-1 sm:ml-0' : 'w-full'}>
                      <div className="flex pr-4 sm:pr-0">
                        {renderVerseNumber(tonganRangeVerse?.number || tonganVerse?.number || verse.number, true)}
                        <span className={`${getFontSizeClass()} ${isCurrentVerse ? 'font-medium' : ''}`}>
                          {renderTonganText(tonganRangeVerse?.text || tonganVerse?.text || '')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="fixed inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-2 sm:px-4">
          <div className="flex-1">
            {prevLink && (
              <Link
                href={prevLink}
                className="pointer-events-auto hidden sm:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50"
                aria-label="Previous Chapter"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {nextLink && (
              <Link
                href={nextLink}
                className="pointer-events-auto hidden sm:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50"
                aria-label="Next Chapter"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            )}
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-white rounded-xl shadow-xl px-4 sm:px-6 py-2 border border-black-100 min-w-[280px]">
          <div 
            className="relative"
            onMouseEnter={() => handleBookSelectorHover(true)}
            onMouseLeave={() => handleBookSelectorHover(false)}
          >
            <button
              className="font-semibold p-2 sm:p-3 rounded-full cursor-pointer text-sm sm:text-base whitespace-nowrap"
              onClick={() => setIsBookSelectorOpen(true)}
            >
              {memoizedEsvBible[book]?.name} {chapter}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={handleParallelToggle}
                className="p-2 hover:bg-[var(--beige)] rounded-full"
                aria-label={isParallel ? "Switch to single column" : "Switch to parallel columns"}
              >
                <Columns className={`w-4 h-4 sm:w-5 sm:h-5 ${isParallel ? 'text-[var(--primary)]' : ''}`} />
              </button>
              
              {user && (
                <button
                  onClick={handleBookmark}
                  disabled={isSaving}
                  className="p-2 hover:bg-[var(--beige)] rounded-full relative"
                  aria-label="Bookmark this chapter"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  ) : (
                    <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {isSaving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              )}
            </div>
            
            <div 
              className="relative"
              onMouseEnter={() => handleReaderSettingsHover(true)}
              onMouseLeave={() => handleReaderSettingsHover(false)}
            >
              <button
                className="p-2 hover:bg-[var(--beige)] rounded-full"
                aria-label="Text Settings"
              >
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>        
        </div>
      </div>
    </main>
  );
}