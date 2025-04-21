import Image from 'next/image';

type RatingType = 'bad' | 'ok' | 'good';

interface RatingButtonProps {
  type: RatingType;
  onClick: () => void;
  currentStatus?: RatingType | 'none';
}

const colors = {
  bad: 'bg-red-100',
  ok: 'bg-yellow-100',
  good: 'bg-green-100',
};

const borderColors = {
  bad: 'border-red-500/40',
  ok: 'border-yellow-500/40',
  good: 'border-green-500/40',
};

export default function RatingButton({ type, onClick, currentStatus }: RatingButtonProps) {
  const isActive = currentStatus === type;
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 w-24 px-4 py-3 rounded-xl box-border hover:opacity-70 ${colors[type]} ${
        isActive ? `border-2 ${borderColors[type]}` : 'border-0'
      }`}
    >
      <Image src={`/faces/${type}.svg`} alt={type} width={28} height={28} />
      <span className="text-base capitalize">{type}</span>
    </button>
  );
} 