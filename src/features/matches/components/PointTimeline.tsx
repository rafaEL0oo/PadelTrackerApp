import { format } from 'date-fns';
import type { MatchPoint } from '@/types';
import { cn } from '@/lib/utils';

interface PointTimelineProps {
  points: MatchPoint[];
  className?: string;
}

export function PointTimeline({ points, className }: PointTimelineProps) {
  if (points.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-slate-400', className)}>
        No points recorded yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {[...points].reverse().map((point) => (
        <div
          key={point.id}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
            point.winner === 'A' ? 'bg-blue-50' : 'bg-orange-50',
          )}
        >
          <span className="w-8 shrink-0 font-mono text-xs text-slate-400">
            #{point.point_number}
          </span>
          <span
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
              point.winner === 'A' ? 'bg-blue-500' : 'bg-orange-500',
            )}
          >
            {point.winner}
          </span>
          <span className="flex-1 font-medium text-slate-700">
            {point.team_a_score} - {point.team_b_score}
          </span>
          <span className="text-xs text-slate-400">
            Set {point.set_score_a}-{point.set_score_b}
          </span>
          <span className="text-xs text-slate-400">
            {format(new Date(point.created_at), 'HH:mm:ss')}
          </span>
        </div>
      ))}
    </div>
  );
}
