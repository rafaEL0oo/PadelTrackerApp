import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/rankings', icon: Trophy, label: 'Rankings' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900">Padel Tracker</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {profile && (
            <div className="hidden items-center gap-3 md:flex">
              <Link to={`/players/${profile.id}`}>
                <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
              </Link>
              <button onClick={signOut} className="text-slate-500 hover:text-slate-700">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-64 transform bg-white shadow-xl transition-transform md:hidden',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex flex-col gap-4 p-6 pt-20">
          {profile && (
            <Link
              to={`/players/${profile.id}`}
              className="flex items-center gap-3"
              onClick={() => setSidebarOpen(false)}
            >
              <Avatar src={profile.avatar_url} name={profile.display_name} />
              <div>
                <p className="font-semibold text-slate-900">{profile.display_name}</p>
                <p className="text-xs text-slate-500">Elo {profile.elo_rating}</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => { signOut(); setSidebarOpen(false); }}
            className="flex items-center gap-2 text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium',
                location.pathname.startsWith(to) ? 'text-teal-600' : 'text-slate-400',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <Link
            to="/dashboard"
            className={cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium',
              location.pathname.includes('/groups') ? 'text-teal-600' : 'text-slate-400',
            )}
          >
            <Users className="h-5 w-5" />
            Groups
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-4">
      {children}
    </div>
  );
}

export function ScoreLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 bg-slate-900">{children}</div>;
}
