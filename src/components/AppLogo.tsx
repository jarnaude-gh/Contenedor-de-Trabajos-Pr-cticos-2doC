import React, { useState } from 'react';
import { Sparkles, Code2 } from 'lucide-react';

interface AppLogoProps {
  logo?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  logo,
  name,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-lg text-sm',
    md: 'w-14 h-14 rounded-xl text-base',
    lg: 'w-20 h-20 rounded-2xl text-xl',
    xl: 'w-28 h-28 rounded-2xl text-2xl',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  // Compute initials or seed color
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (logo && !imageError) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200/80 shadow-sm shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={logo}
          alt={`Logo de ${name}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Generic Don Bosco tech branded placeholder
  return (
    <div
      className={`relative overflow-hidden flex flex-col items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-amber-600 border border-blue-800/20 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:8px_8px] opacity-40"></div>
      <div className="relative z-10 flex items-center justify-center">
        {name.length <= 3 ? (
          <Code2 className={`${iconSizes[size]} text-amber-200`} />
        ) : (
          <span className="tracking-wider drop-shadow-sm font-black">{getInitials(name)}</span>
        )}
      </div>
      <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-300 opacity-80" />
    </div>
  );
};
