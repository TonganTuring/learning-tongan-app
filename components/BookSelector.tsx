import { X, ArrowLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type BookSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: string) => void;
};

const books = {  
  'Bible': [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
    '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]
};

// Map of books to their number of chapters
const bookChapters: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
  'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
  'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
  '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4,
  'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5,
  '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
};

// Map of books to their URL codes
const bookCodes: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE',
  '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV'
};

export default function BookSelector({ isOpen, onClose, onSelectBook }: BookSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setSelectedBook(null);
        setFilterText('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredBooks = Object.entries(books).reduce((acc, [testament, bookList]) => {
    const filteredBookList = bookList.filter(book => 
      book.toLowerCase().includes(filterText.toLowerCase())
    );
    if (filteredBookList.length > 0) {
      acc[testament] = filteredBookList;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      const bookCode = bookCodes[selectedBook];
      onSelectBook(`${bookCode}/${chapter}`);
      onClose();
    }
  };

  const handleBackToBooks = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedBook(null);
      setFilterText('');
      setIsTransitioning(false);
    }, 300);
  };

  const handleBookSelect = (book: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedBook(book);
      setIsTransitioning(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      className={`fixed bottom-21 left-1/2 -translate-x-1/2 bg-[var(--background)] border border-black-100 rounded-lg shadow-lg z-50 w-[80%] max-w-sm h-[50vh] overflow-hidden ${
        isOpen ? 'animate-[slideUp_0.5s_ease-out]' : 'animate-[slideDown_0.3s_ease-in]'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 pb-1 pt-3 flex justify-between items-center">
          <button
            onClick={handleBackToBooks}
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
        
        <div className="relative flex-1 overflow-hidden">
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            selectedBook ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full overflow-y-auto">
              <div className="border-b border-black-100"></div>
              <div className="grid grid-cols-5 gap-3 p-3">
                {selectedBook && Array.from({ length: bookChapters[selectedBook] }, (_, i) => i + 1).map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => handleChapterSelect(chapter)}
                    className={`w-12 h-12 flex items-center justify-center rounded-md text-sm font-medium
                      bg-[var(--beige)] hover:text-[var(--background)] hover:bg-[var(--primary)]
                      transition-colors duration-200 cursor-pointer`}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            selectedBook ? '-translate-x-full' : 'translate-x-0'
          }`}>
            <div className="p-2 pt-1 border-b">
              <input
                type="text"
                placeholder="Filter books..."
                className="w-full px-2 py-1 border rounded-md text-sm"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <div className="p-3">
                {Object.entries(filteredBooks).map(([testament, bookList]) => (
                  <div key={testament} className="grid grid-cols-2 gap-2">
                    {bookList.map((book) => (
                      <button
                        key={book}
                        onClick={() => handleBookSelect(book)}
                        className="w-full text-left px-3 py-1.5 hover:bg-[var(--beige)] rounded-md text-sm cursor-pointer"
                      >
                        {book}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 