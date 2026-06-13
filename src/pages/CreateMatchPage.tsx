import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGroupMembers } from '@/features/groups/hooks/useGroups';
import { useCreateMatch, MATCH_FORMATS } from '@/features/matches/hooks/useMatches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/input';
import type { MatchFormat } from '@/types';
import { useUIStore } from '@/stores/ui.store';

export function CreateMatchPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: members } = useGroupMembers(groupId);
  const createMatch = useCreateMatch();
  const { showToast } = useUIStore();

  const [format, setFormat] = useState<MatchFormat>('bo1');
  const [teamA, setTeamA] = useState<[string, string]>(['', '']);
  const [teamB, setTeamB] = useState<[string, string]>(['', '']);

  const players = members?.map((m) => m.profile) ?? [];

  const handleCreate = async () => {
    if (!user || !teamA[0] || !teamA[1] || !teamB[0] || !teamB[1]) {
      showToast('Select all 4 players', 'error');
      return;
    }

    const allPlayers = [...teamA, ...teamB];
    if (new Set(allPlayers).size !== 4) {
      showToast('Each player can only be selected once', 'error');
      return;
    }

    try {
      const match = await createMatch.mutateAsync({
        input: { groupId, format, teamA, teamB },
        userId: user.id,
      });
      showToast('Match created!', 'success');
      navigate(`/matches/${match.id}`);
    } catch {
      showToast('Failed to create match', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">New Match</h1>

      <Card>
        <CardHeader>
          <CardTitle>Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MATCH_FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                format === f.value
                  ? 'border-teal-600 bg-teal-50 text-teal-800'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <PlayerSelector
        label="Team A"
        team={teamA}
        onChange={setTeamA}
        players={players}
        color="blue"
      />
      <PlayerSelector
        label="Team B"
        team={teamB}
        onChange={setTeamB}
        players={players}
        color="orange"
      />

      <Button onClick={handleCreate} disabled={createMatch.isPending} size="lg" className="w-full">
        Create Match
      </Button>
    </div>
  );
}

function PlayerSelector({
  label,
  team,
  onChange,
  players,
  color,
}: {
  label: string;
  team: [string, string];
  onChange: (team: [string, string]) => void;
  players: Array<{ id: string; display_name: string }>;
  color: 'blue' | 'orange';
}) {
  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-orange-200';

  return (
    <Card className={borderColor}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1].map((idx) => (
          <div key={idx}>
            <Label>Player {idx + 1}</Label>
            <select
              value={team[idx]}
              onChange={(e) => {
                const next: [string, string] = [...team] as [string, string];
                next[idx] = e.target.value;
                onChange(next);
              }}
              className="mt-1 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
