import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mono' | 'compact' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', variant = 'full', size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: 'w-24',
    md: 'w-36',
    lg: 'w-48',
    xl: 'w-64'
  };

  if (variant === 'mono') {
    // Thermal printer monochrome logo (clean grayscale matching logo-ticket.png)
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {!imageError ? (
          <img
            src="/logo-ticket.svg"
            alt="JBM Cítricos"
            onError={() => setImageError(true)}
            className="w-24 h-auto object-contain mb-1 drop-shadow-none"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg
            viewBox="0 0 200 130"
            className="w-20 h-auto text-black"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Leaves */}
            <path
              d="M98 22 C90 12 95 2 108 0 C114 8 114 18 108 22 C103 24 100 24 98 22 Z"
              fill="#555"
            />
            <path
              d="M106 20 C112 10 124 12 128 20 C122 26 112 26 106 20 Z"
              fill="#777"
            />
            {/* Lime Dome */}
            <path
              d="M45 68 C45 34 70 18 100 18 C130 18 155 34 155 68 Z"
              fill="#333"
            />
            {/* Inner pulp pattern */}
            <path
              d="M58 68 C58 45 76 30 100 30 C124 30 142 45 142 68 Z"
              fill="#666"
            />
            <circle cx="85" cy="52" r="3" fill="#aaa" />
            <circle cx="100" cy="46" r="3.5" fill="#aaa" />
            <circle cx="115" cy="52" r="3" fill="#aaa" />
            <circle cx="75" cy="62" r="3" fill="#aaa" />
            <circle cx="100" cy="60" r="3.5" fill="#aaa" />
            <circle cx="125" cy="62" r="3" fill="#aaa" />
            <text
              x="100"
              y="114"
              textAnchor="middle"
              fontFamily="'Impact', 'Arial Black', sans-serif"
              fontSize="54"
              fontWeight="900"
              letterSpacing="2"
              fill="#111"
            >
              JBM
            </text>
            <circle cx="168" cy="78" r="4.5" stroke="#333" strokeWidth="1" fill="none" />
            <text x="168" y="80.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#333">R</text>
          </svg>
        )}
        <div className="font-extrabold text-[14px] tracking-wider text-black font-sans leading-tight mt-0.5">
          JBM CÍTRICOS
        </div>
        <div className="font-bold text-[10px] tracking-[0.25em] text-neutral-800 font-sans">
          BARRAGÁN
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="relative w-10 h-10 flex-shrink-0 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20 border border-emerald-500/30 overflow-hidden p-0.5">
          {!imageError ? (
            <img 
              src="/logo.svg" 
              alt="JBM Logo" 
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg viewBox="0 0 100 80" className="w-7 h-7" fill="none">
              <path d="M50 15 C45 8 50 2 56 0 C60 5 60 12 56 15 Z" fill="#D4A017" />
              <path d="M20 50 C20 28 35 16 50 16 C65 16 80 28 80 50 Z" fill="#22c55e" />
              <path d="M28 50 C28 35 38 25 50 25 C62 25 72 35 72 50 Z" fill="#86efac" />
              <text x="50" y="76" textAnchor="middle" fontFamily="Arial Black" fontSize="32" fontWeight="900" fill="#D4AF37">JBM</text>
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-base text-white tracking-tight leading-none">JBM CÍTRICOS</span>
          <span className="text-[10px] font-bold text-amber-400 tracking-wider">LIMONES BARRAGÁN</span>
        </div>
      </div>
    );
  }

  // Full color logo matching logo.png
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${sizeMap[size]} ${className}`}>
      {!imageError ? (
        <img
          src="/logo.svg"
          alt="JBM Cítricos - Limones Barragán"
          className="w-full h-auto object-contain drop-shadow-sm"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <svg
          viewBox="0 0 320 260"
          className="w-full h-auto drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4A731" />
              <stop offset="35%" stopColor="#B88A1B" />
              <stop offset="70%" stopColor="#C99824" />
              <stop offset="100%" stopColor="#9E7410" />
            </linearGradient>
            <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C69E2D" />
              <stop offset="100%" stopColor="#8E6C15" />
            </linearGradient>
            <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#A8821D" />
            </linearGradient>
            <linearGradient id="limeSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B7D37" />
              <stop offset="100%" stopColor="#045624" />
            </linearGradient>
            <radialGradient id="pulpGrad" cx="50%" cy="80%" r="70%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="40%" stopColor="#4ADE80" />
              <stop offset="80%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </radialGradient>
          </defs>
          <g transform="translate(150, 10)">
            <path d="M18 42 C6 24 16 4 36 0 C46 16 46 36 34 44 C26 48 20 46 18 42 Z" fill="url(#leafGrad1)" />
            <path d="M22 38 Q32 20 35 4" stroke="#7A5A0D" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g transform="translate(178, 14)">
            <path d="M8 32 C18 14 36 18 44 30 C34 40 18 40 8 32 Z" fill="url(#leafGrad2)" />
            <path d="M12 32 Q26 26 40 28" stroke="#7A5A0D" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <path d="M166 48 C167 52 165 56 163 60" stroke="#7A5A0D" strokeWidth="3" strokeLinecap="round" />
          <path d="M72 120 C72 58 112 36 160 36 C208 36 248 58 248 120 Z" fill="url(#limeSkin)" />
          <path d="M92 120 C92 78 120 52 160 52 C200 52 228 78 228 120 Z" fill="url(#pulpGrad)" />
          <text x="160" y="190" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontSize="88" fontWeight="900" letterSpacing="4" fill="url(#goldGradient)" stroke="#7A5A0D" strokeWidth="2.5" paintOrder="stroke fill">
            JBM
          </text>
          <g transform="translate(262, 126)">
            <circle cx="8" cy="8" r="7" stroke="#9E7410" strokeWidth="1.5" fill="none" />
            <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9E7410" fontFamily="Arial">R</text>
          </g>
          <text x="160" y="218" textAnchor="middle" fontFamily="'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif" fontSize="21" fontWeight="800" letterSpacing="2.5" fill="#0B6B34">
            CÍTRICOS PREMIUM
          </text>
          <text x="160" y="252" textAnchor="middle" fontFamily="'Arial Black', 'Montserrat', sans-serif" fontSize="24" fontWeight="900" letterSpacing="2" fill="#065F2C">
            LIMONES BARRAGAN
          </text>
        </svg>
      )}
    </div>
  );
}
