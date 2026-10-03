import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeMap = {
    sm: { dimension: 32, textSize: 'text-sm', subSize: 'text-[9px]' },
    md: { dimension: 42, textSize: 'text-base', subSize: 'text-[10px]' },
    lg: { dimension: 56, textSize: 'text-xl', subSize: 'text-xs' },
    xl: { dimension: 80, textSize: 'text-2xl', subSize: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Handcrafted vector citrus wheel replicating the Fruit Desert linocut emblem */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-full bg-[#181C1F] text-[#F8F7F4] shadow-sm"
        style={{ width: current.dimension, height: current.dimension }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[82%] h-[82%] fill-none stroke-current"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer citrus rind */}
          <circle cx="50" cy="50" r="46" strokeWidth="4.5" />
          <circle cx="50" cy="50" r="41" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.8" />
          <circle cx="50" cy="50" r="38" strokeWidth="2" />

          {/* Central pith core */}
          <circle cx="50" cy="50" r="7" fill="currentColor" />

          {/* 8 Dehydrated citrus fruit pulp segments (carpels) */}
          {/* Segment 1 (Top) */}
          <path d="M 48 41 C 45 32, 45 20, 48 14 C 50 14, 52 14, 52 14 C 55 20, 55 32, 52 41 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 2 */}
          <path d="M 57 44 C 64 38, 72 30, 75 25 C 76 27, 77 28, 77 28 C 72 35, 64 43, 58 47 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 3 (Right) */}
          <path d="M 59 48 C 68 45, 80 45, 86 48 C 86 50, 86 52, 86 52 C 80 55, 68 55, 59 52 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 4 */}
          <path d="M 57 56 C 64 62, 72 70, 75 75 C 74 76, 73 77, 73 77 C 65 72, 58 64, 54 58 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 5 (Bottom) */}
          <path d="M 52 59 C 55 68, 55 80, 52 86 C 50 86, 48 86, 48 86 C 45 80, 45 68, 48 59 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 6 */}
          <path d="M 43 56 C 36 62, 28 70, 25 75 C 24 74, 23 73, 23 73 C 28 65, 36 58, 42 54 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 7 (Left) */}
          <path d="M 41 52 C 32 55, 20 55, 14 52 C 14 50, 14 48, 14 48 C 20 45, 32 45, 41 48 Z" fill="currentColor" fillOpacity="0.85" />
          {/* Segment 8 */}
          <path d="M 43 44 C 36 38, 28 30, 25 25 C 26 24, 27 23, 27 23 C 35 28, 42 36, 46 42 Z" fill="currentColor" fillOpacity="0.85" />

          {/* Vesicle textures / seeds */}
          <circle cx="43" cy="28" r="1.5" fill="#F8F7F4" />
          <circle cx="70" cy="40" r="1.5" fill="#F8F7F4" />
          <circle cx="58" cy="72" r="1.5" fill="#F8F7F4" />
          <circle cx="28" cy="60" r="1.5" fill="#F8F7F4" />
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className={`font-heading font-bold uppercase tracking-wider text-[#181C1F] ${current.textSize}`}>
            FRUIT DESERT
          </span>
        </div>
        {showSubtitle && (
          <p className={`font-sans tracking-wide text-[#64748B] font-medium lowercase ${current.subSize}`}>
            infusions • cocktails • snacks
          </p>
        )}
      </div>
    </div>
  );
};
