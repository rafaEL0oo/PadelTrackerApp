import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMatch,
  getMatchWithDetails,
  getMatchBySlug,
  startMatch,
  registerPoint,
  undoLastPoint,
} from '@/services/match.service';
import type { CreateMatchInput, MatchFormat } from '@/types';

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatchWithDetails(matchId!),
    enabled: !!matchId,
    refetchInterval: false,
  });
}

export function useMatchBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['match-slug', slug],
    queryFn: () => getMatchBySlug(slug!),
    enabled: !!slug,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateMatchInput; userId: string }) =>
      createMatch(input, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-matches'] });
    },
  });
}

export function useStartMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startMatch,
    onSuccess: (data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['group-matches', data.group_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['group-matches'] });
      }
    },
  });
}

export function useRegisterPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, winner }: { matchId: string; winner: 'A' | 'B' }) =>
      registerPoint(matchId, winner),
    onSuccess: (data, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['group-matches', data.group_id] });
      }
    },
  });
}

export function useUndoPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: undoLastPoint,
    onSuccess: (data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: ['group-matches', data.group_id] });
      }
    },
  });
}

export const MATCH_FORMATS: { value: MatchFormat; label: string }[] = [
  { value: 'bo1', label: 'Best of 1 Set' },
  { value: 'bo3', label: 'Best of 3 Sets' },
  { value: 'bo5', label: 'Best of 5 Sets' },
];
