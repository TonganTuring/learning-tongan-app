'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

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

export default function BiblePage() {
  const params = useParams();
  const book = (params.book as string).toUpperCase();
  const chapter = params.chapter as string;
  
  const [isParallel, setIsParallel] = useState(true);
  
  const esvChapter = processVerses(typedEsvBible[book]?.chapters?.[chapter] || []);
  const tonganChapter = processVerses(typedTonganBible[book]?.chapters?.[chapter] || []);
  
  if (!esvChapter.length || !tonganChapter.length) {
    return <div className="p-6">Chapter not found</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6"> 
    <Navbar />
    
      <div className="flex justify-center items-center mb-8 mt-6">
        <h1 className="text-4xl font-bold text-center">
          {typedEsvBible[book]?.name} {chapter}
        </h1>
        
      </div>
      
      <div className={`grid ${isParallel ? 'grid-cols-2 gap-8' : 'grid-cols-1'}`}>
        {/* ESV Bible */}
        <div className={`space-y-4 ${!isParallel && !isParallel ? 'hidden' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">English (ESV)</h2>
          {esvChapter.map((verse) => (
            <div key={`esv-${verse.key}`} className="verse-container">
              <span className="font-semibold mr-2">{verse.number}</span>
              <span>{verse.text}</span>
            </div>
          ))}
        </div>

        {/* Tongan Bible */}
        <div className={`space-y-4 ${!isParallel && isParallel ? 'hidden' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">Tongan</h2>
          {tonganChapter.map((verse) => (
            <div key={`tongan-${verse.key}`} className="verse-container">
              <span className="font-semibold mr-2">{verse.number}</span>
              <span>{verse.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Link
          href={`/bible/${book.toLowerCase()}/${parseInt(chapter) - 1}`}
          className={`flex items-center ${parseInt(chapter) <= 1 ? 'invisible' : ''}`}
        >
          <ChevronLeft className="w-6 h-6" />
          Previous Chapter
        </Link>
        <Link
          href={`/bible/${book.toLowerCase()}/${parseInt(chapter) + 1}`}
          className="flex items-center"
        >
          Next Chapter
          <ChevronRight className="w-6 h-6" />
        </Link>
      </div>
    </main>
  );
}
