import { X, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

type BookSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: string) => void;
  onMouseLeave?: () => void;
};

const books = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah','Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
  '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// Map of books to their number of chapters
export const bookChapters: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
  'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
  'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14,
  'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3,
  'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
  '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

// Map of books to their URL codes
export const bookCodes: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOE', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC',
  'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC',
  'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE',
  '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
};

// Create a reverse mapping for code to book name
export const codeToBook: Record<string, string> = Object.entries(bookCodes).reduce((acc, [book, code]) => {
  acc[code] = book;
  return acc;
}, {} as Record<string, string>);

export default function BookSelector({ isOpen, onClose, onSelectBook, onMouseLeave }: BookSelectorProps) {
  const [filterText, setFilterText] = useState('');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Memoize the click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      const bookCode = bookCodes[selectedBook];
      onSelectBook(`${bookCode}/${chapter}`);
      onClose();
    }
  };

  const filteredBooks = books.filter(book => 
    book.toLowerCase().includes(filterText.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      onMouseLeave={onMouseLeave}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-black-100 rounded-lg shadow-lg z-50 w-[90%] sm:w-[80%] max-w-sm h-[60vh] sm:h-[50vh] overflow-hidden transition-all ease-out duration-300 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 pb-1 pt-3 flex justify-between items-center">
          <button
            onClick={() => setSelectedBook(null)}
            className={`p-1 rounded-full cursor-pointer hover:bg-[var(--beige)] ${!selectedBook ? 'invisible' : ''}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-center flex-1">
            {selectedBook ? 'CHAPTER' : 'SELECT BOOK'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full cursor-pointer hover:bg-[var(--beige)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder={selectedBook ? "Search chapters..." : "Search books..."}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {selectedBook ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {Array.from({ length: bookChapters[selectedBook] }, (_, i) => i + 1).map(chapter => (
                <button
                  key={chapter}
                  onClick={() => handleChapterSelect(chapter)}
                  className="p-2 text-center rounded-lg hover:bg-[var(--beige)]"
                >
                  {chapter}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredBooks.map((book) => (
                <button
                  key={book}
                  onClick={() => setSelectedBook(book)}
                  className="p-2 text-left rounded-lg hover:bg-[var(--beige)]"
                >
                  {book}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 