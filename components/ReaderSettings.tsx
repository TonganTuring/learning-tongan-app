import { X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type FontSize = 'small' | 'medium' | 'large';

type ReaderSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  onFontSizeChange?: (size: FontSize) => void;
};

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

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    // Save to localStorage
    localStorage.setItem('fontSize', size);
    onFontSizeChange?.(size);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      className={`fixed bottom-21 left-1/2 -translate-x-1/2 bg-[var(--background)] border border-black-100 rounded-lg shadow-lg z-50 w-[70%] max-w-xs overflow-hidden ${
        isOpen ? 'animate-[slideUp_0.5s_ease-out]' : 'animate-[slideDown_0.3s_ease-in]'
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
          <div className="flex rounded-lg overflow-hidden border border-black/10 w-full">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={`flex-1 py-2 text-sm ${fontSize === 'small' ? 'bg-[#8B2635] text-white' : 'hover:bg-black/5'}`}
            >
              Aa
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              className={`flex-1 py-2 text-xl ${fontSize === 'medium' ? 'bg-[#8B2635] text-white' : 'hover:bg-black/5'}`}
            >
              Aa
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`flex-1 py-2 text-3xl ${fontSize === 'large' ? 'bg-[#8B2635] text-white' : 'hover:bg-black/5'}`}
            >
              Aa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 