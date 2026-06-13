import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGroupMembers } from '@/features/groups/hooks/useGroups';
import {
  generateRoundRobinSchedule,
  generateAmericanoSchedule,
} from '@/services/tournament.service';
import { createMatch } from '@/services/match.service';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TournamentFormat, MatchFormat } from '@/types';
import { useUIStore } from '@/stores/ui.store';

const FORMATS: { value: TournamentFormat; label: string; description: string }[] = [
  { value: 'round_robin', label: 'Round Robin', description: 'Everyone plays everyone' },
  { value: 'americano', label: 'Americano', description: 'Rotating partners each round' },
  { value: 'mexicano', label: 'Mexicano', description: 'Dynamic pairing by standings' },
];

export function TournamentPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { data: members } = useGroupMembers(groupId);
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('americano');
  const [rounds, setRounds] = useState(4);
  const [matchFormat] = useState<MatchFormat>('bo1');

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!groupId,
  });

  const createTournament = useMutation({
    mutationFn: async () => {
      if (!user || !groupId) throw new Error('Not authenticated');

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          group_id: groupId,
          name,
          format,
          created_by: user.id,
          settings: { rounds, matchFormat, courts: 2 },
        })
        .select()
        .single();
      if (error) throw error;

      const players = (members ?? []).map((m) => ({
        id: m.user_id,
        name: m.profile.display_name,
      }));

      let schedule;
      if (format === 'round_robin') {
        schedule = generateRoundRobinSchedule(players, matchFormat);
      } else if (format === 'americano') {
        schedule = generateAmericanoSchedule(players, rounds);
      } else {
        const standings = new Map(players.map((p) => [p.id, 0]));
        schedule = generateAmericanoSchedule(players, rounds);
        void standings;
      }

      for (const scheduled of schedule) {
        const match = await createMatch(
          {
            groupId,
            format: matchFormat,
            teamA: scheduled.teamA,
            teamB: scheduled.teamB,
            tournamentId: tournament.id,
          },
          user.id,
        );

        await supabase.from('tournament_matches').insert({
          tournament_id: tournament.id,
          match_id: match.id,
          round_number: scheduled.round,
          court_number: scheduled.court ?? null,
          status: 'scheduled',
        });
      }

      await supabase
        .from('tournaments')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', tournament.id);

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments', groupId] });
      setShowCreate(false);
      setName('');
      showToast('Tournament created!', 'success');
    },
    onError: () => showToast('Failed to create tournament', 'error'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tournaments</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Tournament</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday Americano" />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left ${
                    format === f.value ? 'border-teal-600 bg-teal-50' : 'border-slate-200'
                  }`}
                >
                  <p className="font-medium">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.description}</p>
                </button>
              ))}
            </div>
            <div>
              <Label>Rounds</Label>
              <Input type="number" value={rounds} onChange={(e) => setRounds(Number(e.target.value))} min={1} max={20} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createTournament.mutate()} disabled={!name || createTournament.isPending}>
                Generate Schedule
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : tournaments?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-400">
            No tournaments yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tournaments?.map((t) => (
            <Link key={t.id} to={`/groups/${groupId}/tournaments/${t.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs capitalize text-slate-500">{t.format.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Badge variant={t.status === 'active' ? 'success' : 'outline'}>{t.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  const { data: tournamentMatches } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select('*, match:matches(*)')
        .eq('tournament_id', tournamentId!)
        .order('round_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tournamentId,
  });

  const byRound = (tournamentMatches ?? []).reduce<Record<number, typeof tournamentMatches>>(
    (acc, tm) => {
      const round = tm.round_number;
      if (!acc[round]) acc[round] = [];
      acc[round]!.push(tm);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Tournament Schedule</h1>
      {Object.entries(byRound).map(([round, matches]) => (
        <Card key={round}>
          <CardHeader>
            <CardTitle>Round {round}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches?.map((tm) => {
              const m = tm.match as { id: string; status: string } | null;
              return m ? (
                <Link key={tm.id} to={`/matches/${m.id}`} className="block rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Court {tm.court_number ?? '-'}</span>
                    <Badge variant="outline">{m.status.replace('_', ' ')}</Badge>
                  </div>
                </Link>
              ) : null;
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
