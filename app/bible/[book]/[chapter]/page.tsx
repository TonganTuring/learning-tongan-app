'use client';

console.log('=== BIBLE PAGE LOADED ===');

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback, useRef, Suspense, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Type, Columns } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';

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
    } else if (event.key.toLowerCase() === 'p') {
      handleParallelToggle();
    }
  }, [prevLink, nextLink, router, handleParallelToggle]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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

  return (
    <main className="max-w-6xl mx-auto p-6 pb-24">
      <Navbar />
      
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

      {/* Add WordLookup component */}
      <WordLookup
        word={selectedWord}
        position={wordPosition}
        onClose={handleCloseWordLookup}
      />
    
      <div className="flex justify-center items-center mb-8 mt-6">
        <h1 className="text-4xl font-bold text-center">
          {memoizedTonganBible[book]?.name} {chapter}
        </h1>
      </div>
      
      <div className="px-4">
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

          return (
            <div key={verse.number} className="flex mb-4">
              {isParallel && (
                <div className="flex-1 pr-4">
                  {combinedEnglishVerses.length > 0 ? (
                    <div>
                      {combinedEnglishVerses.map((englishVerse) => (
                        <div key={`combined-${englishVerse.number}`} className="flex">
                          <span className="font-semibold text-xs opacity-70 mr-1 min-w-[2rem] text-right shrink-0">{englishVerse.number}</span>
                          <span className={getFontSizeClass()}>{englishVerse.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex">
                      <span className="font-semibold text-xs opacity-70 mr-1 min-w-[2rem] text-right shrink-0">{verse.number}</span>
                      <span className={getFontSizeClass()}>{verse.text}</span>
                    </div>
                  )}
                </div>
              )}

              <div className={isParallel ? 'w-1/2' : 'w-full'}>
                <div className="flex">
                  <span className="font-semibold text-xs opacity-70 mr-1 min-w-[2rem] text-right shrink-0">
                    {tonganRangeVerse?.number || tonganVerse?.number || verse.number}
                  </span>
                  <span className={getFontSizeClass()}>
                    {renderTonganText(tonganRangeVerse?.text || tonganVerse?.text || '')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="fixed inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-4">
        <div className="flex-1">
          {prevLink && (
            <Link
              href={prevLink}
              className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50"
              aria-label="Previous Chapter"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          {nextLink && (
            <Link
              href={nextLink}
              className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-[var(--beige)] shadow-lg hover:bg-[var(--beige)]/50"
              aria-label="Next Chapter"
            >
              <ChevronRight className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white rounded-xl shadow-xl px-4 py-2 border border-black-100">
        <div 
          className="relative"
          onMouseEnter={() => handleBookSelectorHover(true)}
          onMouseLeave={() => handleBookSelectorHover(false)}
        >
          <button
            className="font-semibold p-3 rounded-full cursor-pointer"
            onClick={() => setIsBookSelectorOpen(true)}
          >
            {memoizedEsvBible[book]?.name} {chapter}
          </button>
        </div>

        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleParallelToggle}
              className="p-2 hover:bg-[var(--beige)] rounded-full"
              aria-label={isParallel ? "Switch to single column" : "Switch to parallel columns"}
            >
              <Columns className={`w-5 h-5 ${isParallel ? 'text-[var(--primary)]' : ''}`} />
            </button>
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
              <Type className="w-5 h-5" />
            </button>
          </div>
        </div>        
      </div>
    </main>
  );
}