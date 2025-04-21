import { X, ChevronDown, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import StatusIndicator from './StatusIndicator';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

type SortOption = 'newest' | 'oldest' | 'random';
type StatusType = 'none' | 'bad' | 'ok' | 'good';
type StatusFilter = StatusType[];

type FlashcardSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  onSortChange: (sort: SortOption) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onSwapQAChange: (swap: boolean) => void;
  currentSort: SortOption;
  currentStatusFilter: StatusFilter;
  swapQA: boolean;
};

export default function FlashcardSettings({
  isOpen,
  onClose,
  onSortChange,
  onStatusFilterChange,
  currentSort,
  currentStatusFilter,
  swapQA,
  onSwapQAChange,
}: FlashcardSettingsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const toggleStatus = (status: StatusType) => {
    const newFilter = currentStatusFilter.includes(status)
      ? currentStatusFilter.filter(s => s !== status)
      : [...currentStatusFilter, status];
    onStatusFilterChange(newFilter.length ? newFilter : ['good', 'ok', 'bad', 'none']);
  };

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        ref={menuRef}
        className={`bg-white border border-black/10 rounded-lg shadow-lg z-50 w-[90%] sm:w-[80%] max-w-sm overflow-visible ${
          isOpen ? 'animate-[slideUp_0.3s_ease-out]' : 'animate-[slideDown_0.3s_ease-out]'
        }`}
      >
        <div className="flex flex-col">
          <div className="px-4 py-3 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">
              Flashcard settings
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[var(--beige)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Sort by
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['random', 'newest', 'oldest'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => onSortChange(sort)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentSort === sort
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2" ref={dropdownRef}>
              <label className="block text-sm font-medium">
                Rating
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent flex justify-between items-center"
                >
                  <span>Select ratings</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isStatusDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
                    {(['none', 'bad', 'ok', 'good'] as const).map((status) => (
                      <motion.button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 ${
                          currentStatusFilter.includes(status) ? 'bg-gray-100/50' : ''
                        }`}
                        whileHover={{
                          y: -2,
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ y: 0 }}
                      >
                        <StatusIndicator status={status} size="sm" />
                        <span className="flex-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                        {currentStatusFilter.includes(status) && (
                          <Check className="w-4 h-4 text-[var(--primary)]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Swap Q&A
              </label>
              <button
                onClick={() => onSwapQAChange(!swapQA)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  swapQA ? 'bg-[var(--primary)]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    swapQA ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 