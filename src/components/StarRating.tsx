import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  totalVotes?: number;
  interactive?: boolean;
  onRate?: (score: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalVotes,
  interactive = false,
  onRate,
  size = 'md',
  showNumber = true,
}) => {
  const [hoverScore, setHoverScore] = React.useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const currentScore = hoverScore !== null ? hoverScore : rating;

  if (!interactive && totalVotes === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <div className="flex text-slate-300">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`${starSizes[size]} fill-none stroke-current`} />
          ))}
        </div>
        <span className="italic">Sin calificaciones</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = currentScore >= starValue;
          const isHalf = !isFilled && currentScore >= starValue - 0.5;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHoverScore(starValue)}
              onMouseLeave={() => interactive && setHoverScore(null)}
              onClick={() => interactive && onRate && onRate(starValue)}
              className={`p-0.5 transition-transform ${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded'
                  : 'cursor-default'
              }`}
              title={interactive ? `Calificar con ${starValue} estrella${starValue > 1 ? 's' : ''}` : undefined}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-200'
                    : 'text-slate-300 fill-slate-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showNumber && !interactive && (
        <div className="flex items-center text-xs font-semibold text-slate-700 gap-1">
          <span>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
          {totalVotes !== undefined && (
            <span className="text-slate-500 font-normal">
              ({totalVotes} {totalVotes === 1 ? 'voto' : 'votos'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
