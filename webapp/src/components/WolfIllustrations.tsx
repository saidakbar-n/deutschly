import React from 'react'

// ============================================
// QA Wolf Pixel Art Illustrations
// Authentic recreations of QA Wolf's pixel wolf style
// ============================================

interface WolfIllustrationProps {
  className?: string
  color?: string
  style?: React.CSSProperties
}

// ============================================
// Main Pixel Wolf (Running) - Matches QA Wolf logo style
// ============================================

export const PixelWolfRunning = ({ className = '', color = 'text-indigo-500' }: WolfIllustrationProps) => (
  <svg
    className={`${className} ${color}`}
    viewBox="0 0 100 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Body pixels - forming the running wolf shape */}
    {/* Row 1 (top - ears and head) */}
    <rect x="22" y="10" width="6" height="6" />
    <rect x="28" y="10" width="6" height="6" />
    
    {/* Row 2 (head and back) */}
    <rect x="16" y="15" width="6" height="6" />
    <rect x="22" y="15" width="6" height="6" />
    <rect x="28" y="15" width="6" height="6" />
    <rect x="34" y="15" width="6" height="6" />
    <rect x="40" y="15" width="6" height="6" />
    
    {/* Row 3 (main body) */}
    <rect x="10" y="20" width="6" height="6" />
    <rect x="16" y="20" width="6" height="6" />
    <rect x="22" y="20" width="6" height="6" />
    <rect x="28" y="20" width="6" height="6" />
    <rect x="34" y="20" width="6" height="6" />
    <rect x="40" y="20" width="6" height="6" />
    <rect x="46" y="20" width="6" height="6" />
    
    {/* Row 4 (belly and legs) */}
    <rect x="16" y="25" width="6" height="6" />
    <rect x="22" y="25" width="6" height="6" />
    <rect x="28" y="25" width="6" height="6" />
    <rect x="34" y="25" width="6" height="6" />
    <rect x="40" y="25" width="6" height="6" />
    
    {/* Row 5 (legs and tail base) */}
    <rect x="10" y="30" width="6" height="6" />
    <rect x="16" y="30" width="6" height="6" />
    <rect x="28" y="30" width="6" height="6" />
    <rect x="34" y="30" width="6" height="6" />
    <rect x="40" y="30" width="6" height="6" />
    <rect x="46" y="30" width="6" height="6" />
    
    {/* Tail */}
    <rect x="4" y="25" width="6" height="6" />
    <rect x="4" y="31" width="6" height="6" />
    
    {/* Eyes - white pixels for contrast */}
    <rect x="24" y="17" width="2" height="2" fill="white" />
    <rect x="30" y="17" width="2" height="2" fill="white" />
    
    {/* Nose - small black pixel */}
    <rect x="42" y="22" width="2" height="2" fill="currentColor" />
  </svg>
)

// ============================================
// Pixel Wolf Head (Logo Style)
// ============================================

export const PixelWolfHead = ({ className = '', color = 'text-indigo-500' }: WolfIllustrationProps) => (
  <svg
    className={`${className} ${color}`}
    viewBox="0 0 40 30"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ears */}
    <rect x="10" y="5" width="6" height="6" />
    <rect x="24" y="5" width="6" height="6" />
    
    {/* Head */}
    <rect x="8" y="10" width="6" height="6" />
    <rect x="14" y="10" width="6" height="6" />
    <rect x="20" y="10" width="6" height="6" />
    <rect x="26" y="10" width="6" height="6" />
    
    {/* Muzzle */}
    <rect x="14" y="15" width="6" height="6" />
    <rect x="20" y="15" width="6" height="6" />
    
    {/* Eyes */}
    <rect x="16" y="12" width="2" height="2" fill="white" />
    <rect x="22" y="12" width="2" height="2" fill="white" />
    
    {/* Nose */}
    <rect x="20" y="18" width="2" height="2" fill="currentColor" />
    
    {/* Neck */}
    <rect x="17" y="20" width="6" height="6" />
  </svg>
)

// ============================================
// Pixel Wolf Sitting
// ============================================

export const PixelWolfSitting = ({ className = '', color = 'text-indigo-500' }: WolfIllustrationProps) => (
  <svg
    className={`${className} ${color}`}
    viewBox="0 0 80 60"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Body */}
    <rect x="20" y="25" width="6" height="6" />
    <rect x="26" y="25" width="6" height="6" />
    <rect x="32" y="25" width="6" height="6" />
    <rect x="38" y="25" width="6" height="6" />
    
    {/* Chest */}
    <rect x="23" y="20" width="6" height="6" />
    <rect x="29" y="20" width="6" height="6" />
    <rect x="35" y="20" width="6" height="6" />
    
    {/* Neck */}
    <rect x="26" y="15" width="6" height="6" />
    <rect x="32" y="15" width="6" height="6" />
    
    {/* Head */}
    <rect x="29" y="10" width="6" height="6" />
    <rect x="23" y="10" width="6" height="6" />
    <rect x="35" y="10" width="6" height="6" />
    
    {/* Ears */}
    <rect x="23" y="5" width="6" height="6" />
    <rect x="35" y="5" width="6" height="6" />
    
    {/* Eyes */}
    <rect x="25" y="12" width="2" height="2" fill="white" />
    <rect x="31" y="12" width="2" height="2" fill="white" />
    
    {/* Nose */}
    <rect x="29" y="16" width="2" height="2" fill="currentColor" />
    
    {/* Front legs */}
    <rect x="20" y="30" width="6" height="6" />
    <rect x="20" y="36" width="6" height="6" />
    <rect x="38" y="30" width="6" height="6" />
    <rect x="38" y="36" width="6" height="6" />
    
    {/* Back legs (sitting position) */}
    <rect x="26" y="30" width="6" height="6" />
    <rect x="32" y="30" width="6" height="6" />
    
    {/* Tail - curled */}
    <rect x="14" y="25" width="6" height="6" />
    <rect x="14" y="31" width="6" height="6" />
    <rect x="8" y="31" width="6" height="6" />
  </svg>
)

// ============================================
// Line Art Wolf - Simple outline style
// ============================================

export const LineArtWolf = ({ className = '', color = 'text-indigo-500' }: WolfIllustrationProps) => (
  <svg
    className={`${className} ${color}`}
    viewBox="0 0 120 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Body */}
    <path d="M20 50 L80 50 L90 40 L100 45 L100 55 L90 60 L80 50" />
    
    {/* Head */}
    <path d="M80 50 L95 45 L105 42 L100 40 L105 38 L100 42" />
    
    {/* Eye */}
    <circle cx="100" cy="40" r="1.5" fill="currentColor" />
    <path d="M97 38 L103 38" stroke="white" strokeWidth="1.5" />
    
    {/* Ears */}
    <path d="M95 35 L98 32 L101 35" />
    <path d="M101 35 L104 32 L107 35" />
    
    {/* Legs */}
    <path d="M30 60 L25 70" />
    <path d="M40 60 L35 70" />
    <path d="M70 60 L65 70" />
    <path d="M80 60 L75 70" />
    
    {/* Tail */}
    <path d="M20 50 L10 45 L5 50 L10 55 L20 50" />
    
    {/* Belly line */}
    <path d="M60 55 L100 55" stroke="currentColor" strokeWidth="1" opacity="0.5" />
  </svg>
)

// ============================================
// Wolf with Map (QA Wolf Mapping Agent style)
// ============================================

export const WolfWithMap = ({ className = '', color = 'text-indigo-500' }: WolfIllustrationProps) => (
  <svg
    className={`${className} ${color}`}
    viewBox="0 0 150 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Wolf body */}
    <path d="M40 80 L100 80 L115 65 L125 70 L125 85 L115 90 L100 80" />
    
    {/* Head */}
    <path d="M100 80 L115 75 L125 75 L120 65 L130 60 L125 65" />
    <circle cx="122" cy="72" r="2" fill="currentColor" />
    <path d="M119 70 L125 70" stroke="white" strokeWidth="1.5" />
    
    {/* Ears */}
    <path d="M115 70 L118 67 L121 70" />
    <path d="M121 70 L124 67 L127 70" />
    
    {/* Legs */}
    <path d="M55 95 L50 105" />
    <path d="M70 95 L65 105" />
    <path d="M85 95 L80 105" />
    <path d="M100 95 L95 105" />
    
    {/* Tail */}
    <path d="M40 80 Q25 70 15 75 Q20 85 40 80" />
    
    {/* Map in paws */}
    <rect x="50" y="100" width="20" height="15" stroke="currentColor" fill="none" rx="2" />
    <path d="M55 105 L60 102 L65 105 L60 108 L55 105" stroke="currentColor" fill="none" />
    <path d="M52 108 L57 108" stroke="currentColor" />
    <path d="M63 108 L68 108" stroke="currentColor" />
    <circle cx="55" cy="102" r="0.8" fill="currentColor" />
    <circle cx="65" cy="102" r="0.8" fill="currentColor" />
    <circle cx="60" cy="110" r="0.8" fill="currentColor" />
  </svg>
)

// ============================================
// Wolf Running with Arrow (Action style)
// ============================================

export const WolfRunningWithArrow = ({ className = '' }: WolfIllustrationProps) => (
  <div className={`relative inline-flex items-center gap-2 ${className}`}>
    <PixelWolfRunning className="w-16 h-8" />
    <svg
      className="w-6 h-6 text-indigo-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12 L19 12" />
      <path d="M12 5 L19 12 L12 19" />
    </svg>
  </div>
)

// ============================================
// Multiple Wolves in Formation
// ============================================

export const WolfPack = ({ className = '', count = 3 }: { className?: string; count?: number }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <PixelWolfRunning
        key={i}
        className="w-12 h-6"
        color={`text-indigo-${500 - i * 100}` as string}
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
)

// ============================================
// Animated Pixel Wolf
// ============================================

export const AnimatedPixelWolf = ({ 
  className = '', 
  animation = 'run',
  color = 'text-indigo-500'
}: WolfIllustrationProps & { animation?: 'run' | 'float' | 'bounce' }) => {
  const getAnimationClass = () => {
    switch (animation) {
      case 'run':
        return 'animate-qaw-wolf-run'
      case 'float':
        return 'animate-qaw-float'
      case 'bounce':
        return 'animate-qaw-bounce'
      default:
        return 'animate-qaw-wolf-run'
    }
  }

  return (
    <div className={`inline-block ${getAnimationClass()} ${className}`}>
      <PixelWolfRunning color={color} />
    </div>
  )
}

// ============================================
// Wolf Avatar (Circular)
// ============================================

export const WolfAvatar = ({ 
  className = '', 
  size = 40,
  color = 'text-indigo-500'
}: WolfIllustrationProps & { size?: number }) => (
  <div className={`w-${size} h-${size} rounded-full bg-indigo-50 flex items-center justify-center ${className}`}>
    <PixelWolfHead className={`w-${size / 2} h-${size / 2}`} color={color} />
  </div>
)

// ============================================
// Wolf Logo (For header)
// ============================================

export const WolfLogo = ({ className = '', showText = false }: { className?: string; showText?: boolean }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
      <PixelWolfHead className="w-5 h-5 text-white" />
    </div>
    {showText && (
      <span className="text-xl font-bold text-gradient-indigo">Deutschly</span>
    )}
  </div>
)

// ============================================
// Export all illustrations
// ============================================

export const WolfIllustrations = {
  PixelWolfRunning,
  PixelWolfHead,
  PixelWolfSitting,
  LineArtWolf,
  WolfWithMap,
  WolfRunningWithArrow,
  WolfPack,
  AnimatedPixelWolf,
  WolfAvatar,
  WolfLogo,
}
