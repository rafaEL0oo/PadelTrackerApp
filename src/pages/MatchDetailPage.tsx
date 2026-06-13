import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Share2, Copy, Check, Clock } from 'lucide-react';
import { useMatch, useStartMatch } from '@/features/matches/hooks/useMatches';
import { useMatchRealtime } from '@/hooks/useMatchRealtime';
import { Scoreboard } from '@/features/matches/components/Scoreboard';
import { PointTimeline } from '@/features/matches/components/PointTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/utils';
import { useMatchStore } from '@/stores/match.store';
import { useUIStore } from '@/stores/ui.store';

export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data, isLoading, refetch } = useMatch(matchId);
  const startMatch = useStartMatch();
  const { setMatch, setPlayers, setPoints, match: storeMatch, points } = useMatchStore();
  const { showToast } = useUIStore();
  const [copied, setCopied] = useState(false);

  useMatchRealtime(matchId);

  useEffect(() => {
    if (data) {
      setMatch(data.match);
      setPlayers(data.players);
      setPoints(data.points);
    }
  }, [data, setMatch, setPlayers, setPoints]);

  const match = storeMatch ?? data?.match;
  const players = data?.players ?? [];
  const displayPoints = points.length > 0 ? points : (data?.points ?? []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!match) {
    return <div className="py-12 text-center text-slate-400">Match not found</div>;
  }

  const publicUrl = `${window.location.origin}/m/${match.public_slug}`;

  const handleStart = async () => {
    try {
      await startMatch.mutateAsync(match.id);
      refetch();
      showToast('Match started!', 'success');
    } catch {
      showToast('Failed to start match', 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge variant={match.status === 'in_progress' ? 'success' : match.status === 'completed' ? 'default' : 'outline'}>
          {match.status.replace('_', ' ')}
        </Badge>
        <button onClick={copyLink} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          Share
        </button>
      </div>

      <Scoreboard match={match} players={players} />

      {match.started_at && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          Duration: {formatDuration(match.started_at, match.completed_at)}
        </div>
      )}

      <div className="flex gap-2">
        {match.status === 'scheduled' && (
          <Button onClick={handleStart} disabled={startMatch.isPending} className="flex-1">
            <Play className="mr-1 h-4 w-4" /> Start Match
          </Button>
        )}
        {match.status === 'in_progress' && (
          <Link to={`/matches/${match.id}/score`} className="flex-1">
            <Button size="lg" className="w-full">
              <Play className="mr-1 h-4 w-4" /> Live Score
            </Button>
          </Link>
        )}
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <Share2 className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {match.status === 'completed' && match.winner_team && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-green-800">
              Team {match.winner_team} Wins!
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Point Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <PointTimeline points={displayPoints} />
        </CardContent>
      </Card>
    </div>
  );
}
