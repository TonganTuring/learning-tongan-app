import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type WordLookupProps = {
  word: string;
  position: { x: number; y: number } | null;
  onClose: () => void;
};

type DictionaryEntry = {
  tongan: string;
  english: string;
};

export default function WordLookup({ word, position, onClose }: WordLookupProps) {
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        const response = await fetch('/api/dictionary?word=' + encodeURIComponent(word));
        const data = await response.json();
        setDefinition(data);
      } catch (error) {
        console.error('Error fetching definition:', error);
        setDefinition(null);
      } finally {
        setLoading(false);
      }
    };

    if (word && position) {
      setLoading(true);
      fetchDefinition();
    }
  }, [word]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
      className="fixed bg-[var(--background)] border border-black rounded-xl p-4 min-w-[200px] max-w-[300px] z-50"
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
          <p className="text-sm text-gray-600">{definition.english}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No definition found</p>
      )}

      <div className="flex gap-2 mt-4">
        <button className="primary-button flex-1">Edit</button>
        <button className="primary-button flex-1">Add</button>
      </div>
    </div>
  );
} 