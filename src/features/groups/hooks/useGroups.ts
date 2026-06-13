import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { generateInviteCode } from '@/lib/utils';
import type { Group, GroupMember, Profile } from '@/types';

export function useGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, group:groups(*)')
        .eq('user_id', userId!);
      if (error) throw error;
      return data.map((m) => m.group as unknown as Group);
    },
    enabled: !!userId,
  });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return data as Group;
    },
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as (GroupMember & { profile: Profile })[];
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, userId }: { name: string; description?: string; userId: string }) => {
      const inviteCode = generateInviteCode();

      const { data: group, error } = await supabase
        .from('groups')
        .insert({ name, description: description ?? null, invite_code: inviteCode, created_by: userId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message.includes('foreign key') ? 'Profile not found. Try signing out and back in.' : error.message);
      }

      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
      });

      if (memberError) throw memberError;

      return group as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteCode }: { inviteCode: string; userId: string }) => {
      const { data: group, error } = await supabase.rpc('join_group_by_invite', {
        p_invite_code: inviteCode,
      });

      if (error) {
        if (error.message.includes('Invalid invite')) throw new Error('Invalid invite code');
        throw error;
      }

      return group as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useGroupMatches(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-matches', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*, match_players(*, profile:profiles(*))')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!groupId,
  });
}
