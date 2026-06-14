import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Share2, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useGroup,
  useGroupMembers,
  useGroupMatches,
  useLeaveGroup,
} from '@/features/groups/hooks/useGroups';
import { RankingTable } from '@/features/players/components/RankingTable';
import { InviteLinkCopy } from '@/pages/DashboardPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { computeGroupStats } from '@/services/tournament.service';
import { useUIStore } from '@/stores/ui.store';

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: matches } = useGroupMatches(groupId);
  const leaveGroup = useLeaveGroup();
  const { showToast } = useUIStore();
  const [tab, setTab] = useState('overview');

  if (groupLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!group) {
    return <div className="py-12 text-center text-slate-400">Group not found</div>;
  }

  const profiles = members?.map((m) => m.profile) ?? [];
  const stats = computeGroupStats(profiles);
  const liveMatches = matches?.filter((m) => m.status === 'in_progress') ?? [];
  const upcomingMatches = matches?.filter((m) => m.status === 'scheduled') ?? [];
  const recentMatches = matches?.filter((m) => m.status === 'completed') ?? [];

  const handleLeave = async () => {
    if (!user || !groupId) return;
    try {
      await leaveGroup.mutateAsync({ groupId, userId: user.id });
      showToast('Left group', 'info');
      navigate('/dashboard');
    } catch {
      showToast('Failed to leave group', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
        {group.description && <p className="mt-1 text-sm text-slate-500">{group.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <InviteLinkCopy code={group.invite_code} />
          <Link to={`/groups/${groupId}/tournaments`}>
            <Button variant="outline" size="sm">
              <Trophy className="mr-1 h-4 w-4" /> Tournaments
            </Button>
          </Link>
          <Link to={`/groups/${groupId}/matches/new`}>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Match
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'ranking', label: 'Ranking' },
          { id: 'matches', label: 'Matches' },
          { id: 'members', label: 'Members' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{members?.length ?? 0}</p>
                <p className="text-xs text-slate-500">Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{matches?.length ?? 0}</p>
                <p className="text-xs text-slate-500">Matches</p>
              </CardContent>
            </Card>
          </div>
          {liveMatches.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm text-green-800">Live Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchList matches={liveMatches.slice(0, 3)} highlightLive />
              </CardContent>
            </Card>
          )}
          {stats.mostActivePlayer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Most Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{stats.mostActivePlayer.profile.display_name}</p>
                <p className="text-sm text-slate-500">{stats.mostActivePlayer.matchesPlayed} matches</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'ranking' && <RankingTable profiles={profiles} groupId={groupId} />}

      {tab === 'matches' && (
        <div className="space-y-4">
          {liveMatches.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-green-600">Live Now</h4>
              <MatchList matches={liveMatches} highlightLive />
            </div>
          )}
          {upcomingMatches.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-500">Scheduled</h4>
              <MatchList matches={upcomingMatches} />
            </div>
          )}
          {recentMatches.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-500">Completed</h4>
              <MatchList matches={recentMatches} />
            </div>
          )}
          {liveMatches.length === 0 && upcomingMatches.length === 0 && recentMatches.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No matches yet</p>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-2">
          {members?.map((member) => (
            <Link key={member.id} to={`/players/${member.user_id}`}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <p className="font-medium">{member.profile.display_name}</p>
                  <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                    {member.role}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Button variant="ghost" onClick={handleLeave} className="w-full text-red-600">
            <LogOut className="mr-1 h-4 w-4" /> Leave Group
          </Button>
        </div>
      )}
    </div>
  );
}

function MatchList({
  matches,
  highlightLive = false,
}: {
  matches: Array<{ id: string; status: string; format: string; created_at: string; public_slug: string }>;
  highlightLive?: boolean;
}) {
  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Link key={match.id} to={`/matches/${match.id}`}>
          <Card className={highlightLive ? 'border-green-300 bg-green-50 transition-shadow hover:shadow-md' : 'transition-shadow hover:shadow-md'}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <Badge variant={match.status === 'in_progress' ? 'success' : 'outline'}>
                  {match.status === 'in_progress' ? 'LIVE' : match.status.replace('_', ' ')}
                </Badge>
                <p className="mt-1 text-xs text-slate-400">{match.format.toUpperCase()}</p>
              </div>
              <Share2 className="h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
