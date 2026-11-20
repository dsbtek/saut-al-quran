import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OfflineIndicator from './OfflineIndicator';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isScholarOrAdmin = user?.role === 'scholar' || user?.role === 'admin';

    const navItems = [
        { to: '/', label: 'Home' },
        { to: '/record', label: 'Record' },
        { to: '/feedback', label: 'My Feedback' },
        { to: '/communities', label: 'Communities' },
        ...(isScholarOrAdmin ? [{ to: '/scholar', label: 'Scholar' }] : []),
        { to: '/donations', label: 'Support' },
    ];

    return (
        <div className="min-h-screen bg-sand-50 text-stone-900 pb-20 md:pb-8">
            <OfflineIndicator />

            <header className="bg-emerald-950 text-white shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-3 text-white no-underline">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800/80 text-xl border border-emerald-700/60">
                            🕌
                        </span>
                        <div>
                            <div className="text-lg font-bold tracking-tight leading-tight">
                                Saut Al-Qur&apos;an
                            </div>
                            <div className="font-arabic text-sm text-emerald-200 leading-tight">
                                صوت القرآن
                            </div>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active =
                                item.to === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(item.to);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                        active
                                            ? 'bg-emerald-800 text-white'
                                            : 'text-emerald-100/85 hover:bg-emerald-900 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-medium text-white">
                                {user?.full_name || user?.username}
                            </div>
                            <div className="text-[11px] uppercase tracking-wider text-emerald-300">
                                {user?.role}
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="rounded-lg border border-emerald-700 bg-emerald-900/70 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-800 transition"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

            {/* Mobile bottom navigation */}
            <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-stone-200 bg-white/95 backdrop-blur py-2 md:hidden">
                {navItems.slice(0, 5).map((item) => {
                    const active =
                        item.to === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`px-2 py-1 text-xs font-medium rounded-md ${
                                active ? 'text-emerald-800 font-semibold' : 'text-stone-500'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
