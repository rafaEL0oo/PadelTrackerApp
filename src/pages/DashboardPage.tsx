import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGroups, useCreateGroup, useJoinGroup } from '@/features/groups/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/ui.store';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: groups, isLoading } = useGroups(user?.id);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const { showToast } = useUIStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    if (!groupName.trim() || !user) return;
    try {
      await createGroup.mutateAsync({ name: groupName, userId: user.id });
      setGroupName('');
      setShowCreate(false);
      showToast('Group created!', 'success');
    } catch {
      showToast('Failed to create group', 'error');
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !user) return;
    try {
      await joinGroup.mutateAsync({ inviteCode, userId: user.id });
      setInviteCode('');
      setShowJoin(false);
      showToast('Joined group!', 'success');
    } catch {
      showToast('Invalid invite code', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {profile && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white">
          <p className="text-sm opacity-80">Welcome back</p>
          <h2 className="text-2xl font-bold">{profile.display_name}</h2>
          <div className="mt-3 flex gap-4 text-sm">
            <span>Elo {profile.elo_rating}</span>
            <span>{profile.wins}W - {profile.losses}L</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setShowCreate(true)} className="flex-1">
          <Plus className="mr-1 h-4 w-4" /> Create Group
        </Button>
        <Button variant="outline" onClick={() => setShowJoin(true)} className="flex-1">
          <Users className="mr-1 h-4 w-4" /> Join Group
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Sunday Padel Club"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createGroup.isPending}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showJoin && (
        <Card>
          <CardHeader>
            <CardTitle>Join Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Invite Code</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleJoin} disabled={joinGroup.isPending}>Join</Button>
              <Button variant="ghost" onClick={() => setShowJoin(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-lg font-bold text-slate-900">Your Groups</h3>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : groups?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-400">
              No groups yet. Create or join one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups?.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-slate-500">{group.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InviteLinkCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/join/${code}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy invite link'}
    </button>
  );
}
