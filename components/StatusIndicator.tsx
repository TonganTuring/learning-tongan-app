import Image from 'next/image';

type StatusType = 'none' | 'bad' | 'ok' | 'good';

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colors = {
  none: 'bg-gray-100',
  bad: 'bg-red-100',
  ok: 'bg-yellow-100',
  good: 'bg-green-100',
};

const sizes = {
  sm: {
    container: 'w-8 h-8',
    image: 16,
  },
  md: {
    container: 'w-10 h-10',
    image: 20,
  },
  lg: {
    container: 'w-12 h-12',
    image: 28,
  },
};

export default function StatusIndicator({ status, className = '', size = 'md' }: StatusIndicatorProps) {
  const sizeConfig = sizes[size];

  return (
    <div className={`flex items-center justify-center rounded-full ${colors[status]} ${sizeConfig.container} ${className}`}>
      <Image 
        src={`/faces/${status}.svg`} 
        alt={status} 
        width={sizeConfig.image} 
        height={sizeConfig.image}
      />
    </div>
  );
} 