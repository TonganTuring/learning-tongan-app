import { Flashcard } from '@/types/database';
import StatusIndicator from '@/components/StatusIndicator';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2, Check } from 'lucide-react';

interface FlashcardEditCardProps {
  card: Flashcard;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  allCards: Flashcard[];
  mode: 'edit' | 'select';
}

export default function FlashcardEditCard({ card, isSelected, onSelect, onEdit, onDelete, allCards, mode }: FlashcardEditCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentCard, setCurrentCard] = useState(card);
  const [editValues, setEditValues] = useState({ tongan_phrase: card.tongan_phrase, english_phrase: card.english_phrase });

  const currentIndex = allCards.findIndex(c => c.id === currentCard.id);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % allCards.length;
    const nextCard = allCards[nextIndex];
    setCurrentCard(nextCard);
    setEditValues({
      tongan_phrase: nextCard.tongan_phrase,
      english_phrase: nextCard.english_phrase
    });
    onSelect(nextCard.id);
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + allCards.length) % allCards.length;
    const prevCard = allCards[prevIndex];
    setCurrentCard(prevCard);
    setEditValues({
      tongan_phrase: prevCard.tongan_phrase,
      english_phrase: prevCard.english_phrase
    });
    onSelect(prevCard.id);
  };

  const handleSave = async () => {
    await onEdit(currentCard.id, editValues);
    setIsEditing(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when the modal is open
      if (!isEditing) return;

      // Prevent default behavior for arrow keys to avoid scrolling
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
      }

      // Don't handle navigation if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          setIsEditing(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, currentIndex]); // Re-attach listener when these values change

  return (
    <>
      <div
        className={`px-4 py-6 bg-white rounded-xl shadow-sm border-2 h-[180px] transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] relative ${
          mode === 'select' && isSelected ? 'border-[var(--primary)]' : 'border-transparent'
        }`}
        onClick={() => {
          if (mode === 'select') {
            onSelect(card.id);
          } else if (!isEditing) {
            setIsEditing(true);
            setCurrentCard(card);
            setEditValues({ tongan_phrase: card.tongan_phrase, english_phrase: card.english_phrase });
          }
        }}
      >
        {mode === 'select' && (
          <div 
            className={`absolute top-2 right-2 w-5 h-5 border-2 rounded flex items-center justify-center ${
              isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-gray-300'
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-shrink-0">
            <StatusIndicator status={card.status} size="md" />
          </div>
          <div className="w-full text-xl font-medium truncate">
            {card.tongan_phrase}
          </div>
        </div>
        <div className="w-full text-gray-600 line-clamp-2">
          {card.english_phrase}
        </div>
        <button
          className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
          aria-label="Delete card"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && mode === 'edit' && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsEditing(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            
            <div className="flex items-center justify-between px-6 py-4 border-b">
            <StatusIndicator status={currentCard.status} size="md" />

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevious}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Previous card (Left arrow key)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-base">
                    Card {currentIndex + 1} of {allCards.length}
                  </h2>
                </div>
                <button
                  onClick={handleNext}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Next card (Right arrow key)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Close modal (Escape key)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Tongan Phrase
                </label>
                <input
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  value={editValues.tongan_phrase}
                  onChange={(e) => setEditValues(prev => ({ ...prev, tongan_phrase: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  English Phrase
                </label>
                <textarea
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                  rows={4}
                  value={editValues.english_phrase}
                  onChange={(e) => setEditValues(prev => ({ ...prev, english_phrase: e.target.value }))}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-[#8B0000] rounded-lg hover:bg-[#8B0000]/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 