import React from 'react';

interface AchievementIconProps {
  type: string;
  size?: number;
}

const iconSize = 32;

const AchievementIcon: React.FC<AchievementIconProps> = ({ type, size = iconSize }) => {
  switch (type) {
    case 'most_accurate':
      // Bullseye target
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#FFEB3B" />
          <circle cx="16" cy="16" r="10" fill="#F44336" />
          <circle cx="16" cy="16" r="5" fill="#2196F3" />
        </svg>
      );
    case 'the_painter':
      // Paint palette
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="18" rx="13" ry="10" fill="#FFF176" />
          <circle cx="10" cy="18" r="2" fill="#F44336" />
          <circle cx="16" cy="24" r="2" fill="#4CAF50" />
          <circle cx="22" cy="18" r="2" fill="#2196F3" />
          <circle cx="16" cy="14" r="1.5" fill="#FF9800" />
        </svg>
      );
    case 'best_bullshitter':
      // Winking face with tongue out
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#FFD54F" />
          <ellipse cx="11" cy="14" rx="2" ry="3" fill="#333" />
          <ellipse cx="21" cy="14" rx="2" ry="1.2" fill="#333" />
          <path d="M10 22 Q16 28 22 22" stroke="#E57373" strokeWidth="2" fill="none" />
          <ellipse cx="16" cy="24" rx="2" ry="1" fill="#E57373" />
        </svg>
      );
    case 'the_chaotician':
      // Swirling spiral
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#B39DDB" />
          <path d="M16 8 Q24 10 20 16 Q16 22 12 16 Q8 10 16 8" stroke="#7C4DFF" strokeWidth="2" fill="none" />
          <circle cx="16" cy="16" r="2" fill="#7C4DFF" />
        </svg>
      );
    default:
      // Generic star
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <polygon points="16,3 20,13 31,13 22,19 25,29 16,23 7,29 10,19 1,13 12,13" fill="#FFD700" />
        </svg>
      );
  }
};

export default AchievementIcon; 