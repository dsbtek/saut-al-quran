import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { IslamiyyaClass, PublicLecture, StudentProgressStats } from '../types';
import { IslamicPattern, getHijriDateString } from '../components/IslamicPattern';
import { QuranicVerseBanner, WelcomePillars } from '../components/WelcomeShowcase';

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<StudentProgressStats | null>(null);
    const [liveLectures, setLiveLectures] = useState<PublicLecture[]>([]);
    const [myClasses, setMyClasses] = useState<IslamiyyaClass[]>([]);

    const isScholarOrManager =
        user?.role === 'scholar' || user?.role === 'islamiyya_manager' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';
    const hijriDate = getHijriDateString();

    useEffect(() => {
        apiService.getMyProgressStats().then(setStats).catch(() => setStats(null));
        apiService.getLiveLectures().then(setLiveLectures).catch(() => setLiveLectures([]));
        apiService.getMyClasses().then(setMyClasses).catch(() => setMyClasses([]));
    }, []);

    return (
        <div className="space-y-7">
            {/* Islamic Editorial Welcome Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950 p-6 sm:p-8 text-white shadow-sm border border-emerald-800/40">
                <IslamicPattern className="absolute inset-0 text-amber-200" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                            <span>Assalamu Alaikum, {user?.full_name || user?.username}</span>
                            {hijriDate && (
                                <span className="rounded-full bg-emerald-900/90 px-2.5 py-0.5 text-[11px] font-medium text-emerald-100 border border-emerald-700/60">
                                    {hijriDate}
                                </span>
                            )}
                        </div>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                            Welcome to Your Islamic Learning Sanctuary
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-emerald-100/85 leading-relaxed">
                            Study Qur&apos;an, Fiqh, Hadith, Aqidah, Seerah, and Arabic in structured Islamiyya classes,
                            memorize with full Qur&apos;an recitations, and attend live community lectures.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/memorize"
                            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition shadow-sm"
                        >
                            📖 Qur&apos;an Hifz Player
                        </Link>
                        <Link
                            to="/record"
                            className="rounded-xl border border-emerald-500 bg-emerald-800/90 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-sm"
                        >
                            🎙️ Record Recitation
                        </Link>
                        <Link
                            to="/communities"
                            className="rounded-xl border border-emerald-600 bg-emerald-900/80 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                        >
                            🕌 Explore Islamiyyas
                        </Link>
                        {isScholarOrManager && (
                            <Link
                                to="/scholar"
                                className="rounded-xl border border-amber-400/40 bg-emerald-950/70 px-5 py-3 text-sm font-semibold text-amber-200 hover:bg-emerald-900 transition"
                            >
                                👨‍🏫 Scholar Queue
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
                            >
                                ⚙️ Admin Console
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Qur'anic Verse Spotlight */}
            <QuranicVerseBanner />

            {/* Live & Upcoming Public Lectures */}
            {liveLectures.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                            Live &amp; Upcoming Public Lectures
                        </h2>
                        <Link to="/communities" className="text-xs font-semibold text-emerald-800 hover:underline">
                            Browse Islamiyyas →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {liveLectures.slice(0, 4).map((lec) => (
                            <Link
                                key={lec.id}
                                to={`/lectures/${lec.id}`}
                                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-emerald-800">
                                            {lec.community_name || 'Islamiyya Lecture'}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                                                lec.status === 'live'
                                                    ? 'bg-red-100 text-red-700 animate-pulse'
                                                    : 'bg-amber-100 text-amber-900'
                                            }`}
                                        >
                                            {lec.status === 'live' ? '● Live Now' : 'Scheduled'}
                                        </span>
                                    </div>
                                    <h3 className="mt-2 text-base font-bold text-stone-900">{lec.title}</h3>
                                    <p className="mt-1 text-xs text-stone-600">
                                        Speaker: {lec.speaker_name} • {new Date(lec.scheduled_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                                    <div className="flex gap-1.5">
                                        {lec.stream_targets.map((t, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-700"
                                            >
                                                {t.platform}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-800">
                                        Join Lecture →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* My Classes */}
            {myClasses.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                        My Islamiyya Classes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {myClasses.map((cls) => (
                            <Link
                                key={cls.id}
                                to={`/communities/${cls.community_id}`}
                                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:border-emerald-600 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-emerald-900">
                                        {cls.category.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-stone-500">{cls.schedule_days}</span>
                                </div>
                                <h3 className="mt-2 text-sm font-bold text-stone-900">{cls.title}</h3>
                                {cls.start_time && (
                                    <p className="mt-1 text-xs text-stone-500">
                                        {cls.start_time}–{cls.end_time}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Student Progress Summary */}
            {stats && (
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
                        Your Recitation Progress
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Total Recitations</div>
                            <div className="mt-1 text-2xl font-bold text-stone-900">{stats.total_recitations}</div>
                            <div className="mt-1 text-xs text-stone-500">{stats.pending_count} pending review</div>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Reviewed</div>
                            <div className="mt-1 text-2xl font-bold text-emerald-800">{stats.reviewed_count}</div>
                            <div className="mt-1 text-xs text-amber-700">{stats.needs_revision_count} need revision</div>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium text-stone-500">Surahs Practiced</div>
                            <div className="mt-1 text-2xl font-bold text-stone-900">{stats.surahs_practiced_count}</div>
                            <div className="mt-1 truncate text-xs text-stone-500">
                                {stats.surahs_practiced.length > 0 ? stats.surahs_practiced.join(', ') : 'None yet'}
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

            {/* Welcome Learning Pillars */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                    How Saut Al-Qur&apos;an Works
                </h2>
                <WelcomePillars />
            </section>

            {/* Quick Navigation Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    to="/donations"
                    className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                >
                    <div className="text-2xl mb-2">💝</div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
                        Support Saut Al-Qur&apos;an
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                        Contribute Sadaqah to keep Qur&apos;an education accessible for all.
                    </p>
                </Link>
                <Link
                    to="/user-feedback"
                    className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                >
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-800">
                        Send App Feedback
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                        Report bugs or suggest features to improve the platform.
                    </p>
                </Link>
            </section>
        </div>
    );
};

export default HomePage;
