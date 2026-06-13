import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Target, Flame } from 'lucide-react';
import type { Profile } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatWinRate } from '@/lib/utils';

interface RankingTableProps {
  profiles: Profile[];
  groupId?: string;
}

export function RankingTable({ profiles }: RankingTableProps) {
  if (profiles.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        No players ranked yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile, index) => (
        <Link key={profile.id} to={`/players/${profile.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? 'bg-amber-100 text-amber-700'
                    : index === 1
                      ? 'bg-slate-200 text-slate-600'
                      : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}
              </span>
              <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{profile.display_name}</p>
                <p className="text-xs text-slate-500">
                  {profile.matches_played} matches · {formatWinRate(profile.wins, profile.matches_played)}% win
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-teal-600">{profile.elo_rating}</p>
                <p className="text-xs text-slate-400">Elo</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function PlayerStatsCards({ profile }: { profile: Profile }) {
  const stats = [
    { icon: Target, label: 'Matches', value: profile.matches_played },
    { icon: Trophy, label: 'Wins', value: profile.wins },
    { icon: TrendingUp, label: 'Win Rate', value: `${formatWinRate(profile.wins, profile.matches_played)}%` },
    { icon: Flame, label: 'Best Streak', value: profile.best_win_streak },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <Card key={label}>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <Icon className="h-5 w-5 text-teal-600" />
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
