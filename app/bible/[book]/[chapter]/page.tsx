'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Type } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import BookSelector from '@/app/components/BookSelector';
import ReaderSettings from '@/app/components/ReaderSettings';

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

// Type assertions for the imported JSON
const typedEsvBible = esvBible as Bible;
const typedTonganBible = tonganBible as Bible;

// Function to process verses and combine those marked with "#"
function processVerses(verses: Verse[]): ProcessedVerse[] {
  const processed: ProcessedVerse[] = [];
  let currentVerse: ProcessedVerse | null = null;

  verses.forEach((verse, index) => {
    if (verse.number === '#') {
      // If this is a continuation verse, append it to the previous verse
      if (currentVerse) {
        currentVerse.text = `${currentVerse.text} ${verse.text}`;
      }
    } else {
      // If we had a previous verse, push it to the processed array
      if (currentVerse) {
        processed.push(currentVerse);
      }
      // Start a new verse
      currentVerse = {
        number: verse.number,
        text: verse.text,
        key: `verse-${index}`
      };
    }
  });

  // Don't forget to push the last verse
  if (currentVerse) {
    processed.push(currentVerse);
  }

  return processed;
}

// Function to get the previous book's last chapter
function getPreviousBookLastChapter(currentBook: string): { book: string; chapter: string } | null {
  const books = Object.keys(typedEsvBible);
  const currentIndex = books.indexOf(currentBook);
  
  if (currentIndex <= 0) return null;
  
  const prevBook = books[currentIndex - 1];
  const prevBookChapters = Object.keys(typedEsvBible[prevBook].chapters);
  const lastChapter = prevBookChapters[prevBookChapters.length - 1];
  
  return {
    book: prevBook.toLowerCase(),
    chapter: lastChapter
  };
}

// Function to get the next book's first chapter
function getNextBookFirstChapter(currentBook: string): { book: string; chapter: string } | null {
  const books = Object.keys(typedEsvBible);
  const currentIndex = books.indexOf(currentBook);
  
  if (currentIndex >= books.length - 1) return null;
  
  const nextBook = books[currentIndex + 1];
  
  return {
    book: nextBook.toLowerCase(),
    chapter: '1'
  };
}

export default function BiblePage() {
  const params = useParams();
  const router = useRouter();
  const book = (params.book as string).toUpperCase();
  const chapter = params.chapter as string;
  
  const [isParallel, setIsParallel] = useState(() => {
    // Initialize from localStorage, default to true if not set
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
    // Initialize from localStorage, default to 'small' if not set
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSize');
      return (saved as 'small' | 'medium' | 'large') || 'small';
    }
    return 'small';
  });
  
  const esvChapter = processVerses(typedEsvBible[book]?.chapters?.[chapter] || []);
  const tonganChapter = processVerses(typedTonganBible[book]?.chapters?.[chapter] || []);
  
  if (!esvChapter.length || !tonganChapter.length) {
    return <div className="p-6">Chapter not found</div>;
  }

  const handleBookSelectorOpen = () => {
    setIsReaderSettingsOpen(false);
    setIsBookSelectorOpen(true);
  };

  const handleReaderSettingsOpen = () => {
    setIsBookSelectorOpen(false);
    setIsReaderSettingsOpen(true);
  };

  const prevChapter = parseInt(chapter) - 1;
  const nextChapter = parseInt(chapter) + 1;
  
  const prevBookLastChapter = getPreviousBookLastChapter(book);
  const nextBookFirstChapter = getNextBookFirstChapter(book);
  
  const prevLink = prevChapter >= 1 
    ? `/bible/${book.toLowerCase()}/${prevChapter}`
    : prevBookLastChapter 
      ? `/bible/${prevBookLastChapter.book}/${prevBookLastChapter.chapter}`
      : null;
      
  const nextLink = typedEsvBible[book]?.chapters?.[nextChapter.toString()]
    ? `/bible/${book.toLowerCase()}/${nextChapter}`
    : nextBookFirstChapter
      ? `/bible/${nextBookFirstChapter.book}/${nextBookFirstChapter.chapter}`
      : null;

  const handleBookSelect = (selectedBook: string) => {
    const [book, chapter] = selectedBook.split('/');
    router.push(`/bible/${book.toLowerCase()}/${chapter}`);
  };

  const handleParallelToggle = () => {
    setIsVisible(false);
    setTimeout(() => {
      const newValue = !isParallel;
      setIsParallel(newValue);
      // Save to localStorage
      localStorage.setItem('parallelMode', String(newValue));
      setIsVisible(true);
    }, 200);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base';
      case 'medium':
        return 'text-lg';
      case 'large':
        return 'text-xl';
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 pb-24">
      <Navbar />
      
      <BookSelector
        isOpen={isBookSelectorOpen}
        onClose={() => setIsBookSelectorOpen(false)}
        onSelectBook={handleBookSelect}
      />

      <ReaderSettings
        isOpen={isReaderSettingsOpen}
        onClose={() => setIsReaderSettingsOpen(false)}
        onFontSizeChange={handleFontSizeChange}
      />
    
      <div className="flex justify-center items-center mb-8 mt-6">
        <h1 className="text-4xl font-bold text-center">
          {typedEsvBible[book]?.name} {chapter}
        </h1>
      </div>
      
      <div className={`px-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="space-y-4">
          {esvChapter.map((verse) => {
            const tonganVerse = tonganChapter.find(v => v.number === verse.number);
            return (
              <div 
                key={`verse-${verse.number}`} 
                className={`${isParallel ? 'flex gap-8' : 'flex'}`}
              >
                {/* ESV Bible - only show in parallel mode */}
                {isParallel && (
                  <div className="flex-1 flex items-start">
                    <span className="font-semibold mr-2 min-w-[2rem] text-right">{verse.number}</span>
                    <span className={`flex-1 ${getFontSizeClass()}`}>{verse.text}</span>
                  </div>
                )}

                {/* Tongan Bible */}
                <div className={`${isParallel ? 'w-1/2' : 'w-full'} flex items-start`}>
                  <span className="font-semibold mr-2 min-w-[2rem] text-right">{verse.number}</span>
                  <span className={`flex-1 ${getFontSizeClass()}`}>{tonganVerse?.text || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
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

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--background)] rounded-xl shadow-xl px-4 py-2 border border-black-100">
        <button
          onClick={handleBookSelectorOpen}
          className="text-sm font-semibold p-3 rounded-full cursor-pointer"
        >
          {typedEsvBible[book]?.name} {chapter}
        </button>

        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleParallelToggle}
              className="flex items-center gap-2"
            >
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out relative ${isParallel ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${isParallel ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-semibold">Parallel</span>
            </button>
          </div>
          
          <button
            onClick={handleReaderSettingsOpen}
            className="p-2 hover:bg-[var(--beige)] rounded-full"
            aria-label="Text Settings"
          >
            <Type className="w-5 h-5" />
          </button>
        </div>        
      </div>
    </main>
  );
}
