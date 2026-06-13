import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout, AuthLayout, ScoreLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/components/layout/ProtectedRoute';
import { Toast } from '@/components/ui/toast';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GroupDetailPage } from '@/pages/GroupDetailPage';
import { CreateMatchPage } from '@/pages/CreateMatchPage';
import { MatchDetailPage } from '@/pages/MatchDetailPage';
import { LiveScorePage } from '@/pages/LiveScorePage';
import { PublicMatchPage } from '@/pages/PublicMatchPage';
import { RankingsPage } from '@/pages/RankingsPage';
import { PlayerProfilePage } from '@/pages/PlayerProfilePage';
import { TournamentPage, TournamentDetailPage } from '@/pages/TournamentPage';
import { JoinGroupPage } from '@/pages/JoinGroupPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toast />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GroupDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups/:groupId/matches/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CreateMatchPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups/:groupId/tournaments"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TournamentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups/:groupId/tournaments/:tournamentId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TournamentDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/matches/:matchId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MatchDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/matches/:matchId/score"
            element={
              <ProtectedRoute>
                <ScoreLayout>
                  <LiveScorePage />
                </ScoreLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/m/:slug" element={<PublicMatchPage />} />

          <Route
            path="/rankings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RankingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/players/:playerId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PlayerProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/join/:inviteCode" element={<JoinGroupPage />} />

          <Route path="/" element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
          <Route path="*" element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
