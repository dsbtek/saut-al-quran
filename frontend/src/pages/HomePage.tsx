import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { StudentProgressStats } from '../types';

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<StudentProgressStats | null>(null);
    const isScholarOrAdmin = user?.role === 'scholar' || user?.role === 'admin';

    useEffect(() => {
        apiService
            .getMyProgressStats()
            .then(setStats)
            .catch(() => setStats(null));
    }, []);

    return (
        <div className="space-y-6">
            {/* Hero banner */}
            <section className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 sm:p-8 text-white shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                            Assalamu Alaikum, {user?.full_name || user?.username}
                        </p>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
                            Refine your Tajweed &amp; Recitation
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-emerald-100/85">
                            Record your recitation, practice difficult ayahs with A/B repeat loops,
                            and receive timestamped text &amp; voice feedback from certified scholars.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/record"
                            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition shadow-sm"
                        >
                            🎙️ Start Recording
                        </Link>
                        {isScholarOrAdmin && (
                            <Link
                                to="/scholar"
                                className="rounded-xl border border-emerald-600 bg-emerald-800/70 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                            >
                                👨‍🏫 Scholar Queue
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Student Progress Summary */}
            {stats && (
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
                        Your Recitation Progress
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Total Recitations</div>
                            <div className="mt-1 text-2xl font-bold text-stone-900">
                                {stats.total_recitations}
                            </div>
                            <div className="mt-1 text-xs text-stone-500">
                                {stats.pending_count} pending review
                            </div>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Reviewed</div>
                            <div className="mt-1 text-2xl font-bold text-emerald-800">
                                {stats.reviewed_count}
                            </div>
                            <div className="mt-1 text-xs text-amber-700">
                                {stats.needs_revision_count} need revision
                            </div>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Surahs Practiced</div>
                            <div className="mt-1 text-2xl font-bold text-stone-900">
                                {stats.surahs_practiced_count}
                            </div>
                            <div className="mt-1 truncate text-xs text-stone-500">
                                {stats.surahs_practiced.length > 0
                                    ? stats.surahs_practiced.join(', ')
                                    : 'None yet'}
                            </div>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Feedback Notes</div>
                            <div className="mt-1 text-2xl font-bold text-stone-900">
                                {stats.resolved_comments}/{stats.total_comments}
                            </div>
                            <div className="mt-1 text-xs text-stone-500">
                                resolved ({stats.unresolved_comments} open)
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Quick Navigation Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                    to="/feedback"
                    className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                >
                    <div className="text-2xl mb-2">🎧</div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
                        My Feedback &amp; Recordings
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                        Listen to scholar comments, jump to timestamps, and track resolved notes.
                    </p>
                </Link>

                <Link
                    to="/communities"
                    className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                >
                    <div className="text-2xl mb-2">🕌</div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
                        Islamiyya Communities
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                        Join local learning circles and connect with teachers and peers.
                    </p>
                </Link>

                <Link
                    to="/donations"
                    className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                >
                    <div className="text-2xl mb-2">💝</div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
                        Support Saut Al-Qur&apos;an
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                        Contribute to keeping scholar reviews accessible for everyone.
                    </p>
                </Link>
            </section>

            <section className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm">
                <span className="text-stone-600">
                    Have a bug report or feature idea?
                </span>
                <Link
                    to="/user-feedback"
                    className="font-semibold text-emerald-800 hover:underline"
                >
                    Send App Feedback →
                </Link>
            </section>
        </div>
    );
};

export default HomePage;
