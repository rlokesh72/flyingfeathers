'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Trophy,
  Users,
  MapPin,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Feather,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const navItems = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
  { label: 'Players', href: '/dashboard/players', icon: Users },
  { label: 'Venues', href: '/dashboard/venues', icon: MapPin },
  { label: 'History', href: '/dashboard/history', icon: History },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.id) {
        router.push('/login');
        return;
      }
      setUser(parsed);
      setReady(true);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`
        ${mobile ? 'flex' : 'hidden lg:flex'}
        flex-col h-full w-64 bg-slate-900 border-r border-white/5
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src="/flying-feathers-logo.png"
            alt="Flying Feathers"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-tight truncate">Flying Feathers</p>
          <p className="text-cyan-400 text-xs">Admin Panel</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white ml-auto">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop sidebar — fixed */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Feather size={16} className="text-cyan-400" />
            <span className="text-white text-sm font-semibold">Admin Panel</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
