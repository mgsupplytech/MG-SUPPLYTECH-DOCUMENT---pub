import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'original' | 'gold' | 'monochrome';
  size?: number | string;
  showText?: boolean;
}

export const MGLogo: React.FC<LogoProps> = ({
  className = '',
  variant = 'original',
  size = 64,
  showText = false
}) => {
  const isGold = variant === 'gold';
  const isMono = variant === 'monochrome';

  // Palette based on variant
  const primaryFill = isGold ? 'url(#mg-gold-grad)' : isMono ? '#111827' : '#014136';
  const accentFill = isGold ? 'url(#mg-gold-grad-light)' : isMono ? '#374151' : '#DFBC64';
  const borderStroke = isGold ? 'url(#mg-gold-grad)' : isMono ? '#111827' : '#DFBC64';
  const innerBg = isGold ? 'transparent' : isMono ? '#FFFFFF' : '#FFFFFF';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
      >
        <defs>
          {/* Rich metallic gold gradient matching the brand reference */}
          <linearGradient id="mg-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBC64" />
            <stop offset="35%" stopColor="#F7E6A1" />
            <stop offset="70%" stopColor="#D4A745" />
            <stop offset="100%" stopColor="#9E7620" />
          </linearGradient>

          <linearGradient id="mg-gold-grad-light" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5DC8C" />
            <stop offset="100%" stopColor="#D9AA3A" />
          </linearGradient>

          <linearGradient id="mg-green-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#014E41" />
            <stop offset="100%" stopColor="#002E27" />
          </linearGradient>

          <filter id="badge-shadow" x="-5%" y="-5%" width="115%" height="115%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Hexagonal Shield */}
        <polygon
          points="100,10 180,56 180,144 100,190 20,144 20,56"
          stroke={borderStroke}
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={innerBg}
        />

        {/* Inner thin accent hexagonal ring */}
        <polygon
          points="100,19 171,60 171,140 100,181 29,140 29,60"
          stroke={accentFill}
          strokeWidth="2.5"
          strokeLinejoin="round"
          opacity="0.85"
          fill="none"
        />

        {/* MG Emblem Group */}
        <g transform="translate(0, 0)">
          {/* "M" Letterform */}
          <path
            d="M 42 142 L 42 68 L 56 68 L 74 108 L 92 68 L 106 68 L 106 142 L 91 142 L 91 93 L 78 122 L 69 122 L 57 93 L 57 142 Z"
            fill={primaryFill}
          />

          {/* "G" Letterform */}
          <path
            d="M 160 88 C 153 72 138 64 122 64 C 98 64 88 84 88 105 C 88 127 101 145 125 145 C 145 145 158 134 161 115 L 126 115 L 126 102 L 174 102 L 174 116 C 170 138 153 158 125 158 C 90 158 72 132 72 105 C 72 77 92 51 125 51 C 146 51 163 61 172 80 Z"
            fill={primaryFill}
          />

          {/* 4-Square Architectural Window Panes in G */}
          <rect x="135" y="74" width="10" height="10" rx="1" fill={accentFill} />
          <rect x="148" y="74" width="10" height="10" rx="1" fill={accentFill} />
          <rect x="135" y="87" width="10" height="10" rx="1" fill={accentFill} />
          <rect x="148" y="87" width="10" height="10" rx="1" fill={accentFill} />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 leading-none">
            <span className="font-black tracking-tight text-xl font-['Playfair_Display',Georgia,serif] text-[#014136] dark:text-[#E3ECE8]">
              MG
            </span>
            <span className="font-black tracking-wider text-xl font-['Plus_Jakarta_Sans',sans-serif] text-[#B88C2E] dark:text-[#DFBC64]">
              SUPPLYTECH
            </span>
          </div>
          <span className="text-[9px] font-extrabold tracking-[0.25em] text-[#B88C2E] dark:text-[#DFBC64] uppercase mt-0.5">
            BUILDING POSSIBILITIES
          </span>
        </div>
      )}
    </div>
  );
};

export const WhatsAppQR: React.FC<{ size?: number | string; className?: string }> = ({
  size = 64,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center bg-white p-1.5 rounded-lg border border-[#D9DEDB] shadow-sm ${className}`}>
      {/* High-accuracy vector representation of WhatsApp QR for +91 83739 76489 */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="black"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Corner Positional Finders */}
        <path d="M 5 5 H 35 V 35 H 5 Z M 10 10 V 30 H 30 V 10 Z M 15 15 H 25 V 25 H 15 Z" fill="#014136" />
        <path d="M 65 5 H 95 V 35 H 65 Z M 70 10 V 30 H 90 V 10 Z M 75 15 H 85 V 25 H 75 Z" fill="#014136" />
        <path d="M 5 65 H 35 V 95 H 5 Z M 10 70 V 90 H 30 V 70 Z M 15 75 H 25 V 85 H 15 Z" fill="#014136" />
        
        {/* Alignment & Data Pattern Matrix */}
        <rect x="42" y="8" width="6" height="6" />
        <rect x="52" y="8" width="6" height="6" />
        <rect x="42" y="20" width="6" height="12" />
        <rect x="52" y="24" width="6" height="8" />

        {/* Center alignment box */}
        <path d="M 68 68 H 88 V 88 H 68 Z M 72 72 V 84 H 84 V 72 Z M 76 76 H 80 V 80 H 76 Z" fill="#B88C2E" />

        {/* Data Dots */}
        <rect x="10" y="42" width="6" height="6" />
        <rect x="22" y="42" width="12" height="6" />
        <rect x="10" y="52" width="18" height="6" />
        <rect x="40" y="42" width="6" height="18" fill="#014136" />
        <rect x="50" y="46" width="12" height="6" />
        <rect x="50" y="56" width="6" height="12" />
        <rect x="60" y="52" width="8" height="6" />
        
        <rect x="42" y="74" width="6" height="16" />
        <rect x="52" y="82" width="10" height="8" />
        <rect x="52" y="70" width="6" height="8" />
        <rect x="90" y="42" width="5" height="14" />
        <rect x="78" y="42" width="8" height="6" />
        <rect x="90" y="60" width="5" height="8" />
      </svg>
      <span className="text-[7.5px] font-black tracking-wider text-[#014136] uppercase mt-1">
        WhatsApp
      </span>
    </div>
  );
};
