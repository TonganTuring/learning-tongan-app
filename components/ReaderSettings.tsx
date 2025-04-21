import { X } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

type FontSize = 'small' | 'medium' | 'large';

type ReaderSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  onFontSizeChange?: (size: FontSize) => void;
};

// Memoize the font size options
const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Aa', className: 'text-sm' },
  { value: 'medium', label: 'Aa', className: 'text-xl' },
  { value: 'large', label: 'Aa', className: 'text-3xl' },
] as const;

export default function ReaderSettings({ isOpen, onClose, onFontSizeChange }: ReaderSettingsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    // Initialize from localStorage, default to 'small' if not set
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fontSize');
      return (saved as FontSize) || 'small';
    }
    return 'small';
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Memoize the visibility effect
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

  // Memoize the event listener effect
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Memoize the font size change handler
  const handleFontSizeChange = useCallback((size: FontSize) => {
    setFontSize(size);
    // Save to localStorage
    localStorage.setItem('fontSize', size);
    onFontSizeChange?.(size);
  }, [onFontSizeChange]);

  // Memoize the font size buttons
  const fontSizeButtons = useMemo(() => {
    return (
      <div className="flex rounded-lg overflow-hidden border border-black/10 w-full">
        {FONT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFontSizeChange(option.value)}
            className={`flex-1 py-2 ${option.className} ${
              fontSize === option.value ? 'bg-[#8B2635] text-white' : 'hover:bg-black/5'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }, [fontSize, handleFontSizeChange]);

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-black-100 rounded-lg shadow-lg z-50 w-[70%] max-w-xs overflow-hidden transition-all ease-out duration-300 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col">
        <div className="px-2 pb-1 pt-2 flex justify-between items-center">
          <h2 className="text-base font-semibold text-center flex-1">
            READER SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full cursor-pointer hover:bg-[var(--beige)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="border-t border-black mb-2" />

        <div className="px-4 pb-4">
          {fontSizeButtons}
        </div>
      </div>
    </div>
  );
} 