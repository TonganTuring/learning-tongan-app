import { X, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import StatusIndicator from './StatusIndicator';
import { createPortal } from 'react-dom';

type SortOption = 'newest' | 'oldest' | 'random';
type StatusFilter = ('good' | 'ok' | 'bad' | 'none')[];

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
  onSwapQAChange,
  currentSort,
  currentStatusFilter,
  swapQA,
}: FlashcardSettingsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

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

  const statusOptions = [
    { value: 'bad', label: 'Bad' },
    { value: 'ok', label: 'OK' },
    { value: 'good', label: 'Good' },
    { value: 'none', label: 'Unrated' },
  ];

  const toggleStatus = (status: 'good' | 'ok' | 'bad' | 'none') => {
    const newFilter = currentStatusFilter.includes(status)
      ? currentStatusFilter.filter(s => s !== status)
      : [...currentStatusFilter, status];
    onStatusFilterChange(newFilter.length ? newFilter : ['good', 'ok', 'bad', 'none']);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen || isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen, isSortDropdownOpen]);

  useEffect(() => {
    if (isStatusDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isStatusDropdownOpen]);

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'random', label: 'Random' },
  ];

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        ref={menuRef}
        className={`bg-white border border-black/10 rounded-lg shadow-lg z-50 w-[80%] max-w-sm overflow-visible ${
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

          <div className="p-6 space-y-6">
            {/* Sort options */}
            <div className="space-y-2" ref={sortDropdownRef}>
              <label className="block text-sm font-medium">
                Sort by
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent flex justify-between items-center"
                >
                  <span>{sortOptions.find(opt => opt.value === currentSort)?.label}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isSortDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {sortOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer border-l-[3px] transition-all duration-200 ${
                          currentSort === option.value
                            ? 'bg-[var(--primary)]/5 border-l-[var(--primary)]'
                            : 'border-l-transparent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSortChange(option.value as SortOption);
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        <span className="text-gray-900">{option.label}</span>
                        <input
                          type="radio"
                          checked={currentSort === option.value}
                          onChange={() => {}}
                          className="h-4 w-4 rounded-full border-2 border-gray-300 text-[var(--primary)] 
                          focus:ring-[var(--primary)] focus:ring-offset-0 focus:ring-2 
                          checked:bg-[var(--primary)] checked:border-[var(--primary)]
                          transition-colors duration-200 cursor-pointer accent-[var(--primary)]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status filter */}
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
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer border-l-[3px] transition-all duration-200 ${
                          currentStatusFilter.includes(option.value as any)
                            ? 'bg-[var(--primary)]/5 border-l-[var(--primary)]'
                            : 'border-l-transparent'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(option.value as any);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <StatusIndicator status={option.value as any} size="sm" />
                          <span className="text-gray-900">{option.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={currentStatusFilter.includes(option.value as any)}
                          onChange={() => {}}
                          className="h-4 w-4 rounded-md border-2 border-gray-300 text-[var(--primary)] 
                          focus:ring-[var(--primary)] focus:ring-offset-0 focus:ring-2 
                          checked:bg-[var(--primary)] checked:border-[var(--primary)]
                          transition-colors duration-200 cursor-pointer accent-[var(--primary)]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={swapQA}
                  onChange={(e) => onSwapQAChange(e.target.checked)}
                  className="h-4 w-4 rounded-md border-2 border-gray-300 text-[var(--primary)] 
                  focus:ring-[var(--primary)] focus:ring-offset-0 focus:ring-2 
                  checked:bg-[var(--primary)] checked:border-[var(--primary)]
                  transition-colors duration-200 cursor-pointer accent-[var(--primary)]"
                />
                <span className="text-sm">Swap question and answer</span>
              </label>
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