import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecitationWithDetails } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ScholarDashboard: React.FC = () => {
    const { user } = useAuth();
    const [recitations, setRecitations] = useState<RecitationWithDetails[]>([]);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'needs_revision' | 'all'>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'scholar' || user?.role === 'admin') {
            loadRecitations(statusFilter);
        }
    }, [user, statusFilter]);

    const loadRecitations = async (filter: typeof statusFilter) => {
        try {
            setIsLoading(true);
            setError('');
            const data =
                filter === 'all'
                    ? await apiService.getAllScholarRecitations()
                    : await apiService.getAllScholarRecitations(filter);
            setRecitations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recitations');
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.role !== 'scholar' && user?.role !== 'admin') {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
                <p className="mt-2 text-sm text-stone-600">
                    Only certified scholars and administrators can access the review queue.
                </p>
                <Link
                    to="/"
                    className="mt-4 inline-block rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
                >
                    ← Back Home
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Scholar Review Queue</h1>
                    <p className="text-sm text-stone-600">
                        Listen to student recitations and provide timestamped Tajweed feedback.
                    </p>
                </div>

                <div className="flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
                    {(['pending', 'needs_revision', 'reviewed', 'all'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                                statusFilter === tab
                                    ? 'bg-emerald-800 text-white'
                                    : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="py-12 text-center text-sm text-stone-500">Loading submissions...</div>
            ) : recitations.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
                    No recitations found in this queue.
                </div>
            ) : (
                <div className="space-y-3">
                    {recitations.map((rec) => (
                        <div
                            key={rec.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-500 transition"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-stone-900">
                                        {rec.surah_name} ({rec.ayah_start}–{rec.ayah_end})
                                    </h3>
                                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-stone-700">
                                        {rec.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-stone-600">
                                    Student:{' '}
                                    <span className="font-medium text-stone-800">
                                        {rec.user?.full_name || rec.user?.username || 'Student'}
                                    </span>
                                    {rec.duration ? ` • ${formatTime(rec.duration)}` : ''}
                                </p>
                                <p className="mt-0.5 text-xs text-stone-400">
                                    Submitted {new Date(rec.created_at).toLocaleString()} •{' '}
                                    {rec.comments?.length || 0} comments • {rec.markers?.length || 0} markers
                                </p>
                            </div>

                            <Link
                                to={`/scholar/review/${rec.id}`}
                                className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 transition"
                            >
                                🎧 Open Review
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScholarDashboard;
