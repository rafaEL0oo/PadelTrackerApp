import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJoinGroup } from '@/features/groups/hooks/useGroups';
import { Spinner } from '@/components/ui/skeleton';

export function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading } = useAuth();
  const joinGroup = useJoinGroup();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/join/${inviteCode}`);
      return;
    }
    if (!inviteCode) return;

    joinGroup
      .mutateAsync({ inviteCode, userId: user.id })
      .then((group) => navigate(`/groups/${group.id}`))
      .catch(() => navigate('/dashboard'));
  }, [user, loading, inviteCode, joinGroup, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
      <p className="ml-3 text-slate-500">Joining group...</p>
    </div>
  );
}
