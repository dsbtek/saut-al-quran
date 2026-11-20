import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recitation, RecitationWithDetails } from '../types';
import { apiService } from '../services/api';
import UnifiedWaveformPlayer from '../components/UnifiedWaveformPlayer';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const statusBadge = (status: Recitation['status']) => {
    switch (status) {
        case 'reviewed':
            return 'bg-emerald-100 text-emerald-900 border-emerald-200';
        case 'needs_revision':
            return 'bg-amber-100 text-amber-900 border-amber-200';
        default:
            return 'bg-stone-100 text-stone-700 border-stone-200';
    }
};

const FeedbackPage: React.FC = () => {
    const [recitations, setRecitations] = useState<Recitation[]>([]);
    const [selected, setSelected] = useState<RecitationWithDetails | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [commentAudioUrls, setCommentAudioUrls] = useState<Record<number, string>>({});
    const [seekTime, setSeekTime] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        loadRecitations();
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    const loadRecitations = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getRecitations();
            setRecitations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recitations');
        } finally {
            setIsLoading(false);
        }
    };

    const loadDetails = async (recitationId: number) => {
        try {
            setError('');
            const details = await apiService.getRecitation(recitationId);
            setSelected(details);
            setSeekTime(null);

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }

            if (details.audio_file_path) {
                const blob = await apiService.getRecitationAudio(details.id);
                const url = URL.createObjectURL(blob);
                objectUrlRef.current = url;
                setAudioUrl(url);
            } else {
                setAudioUrl('');
            }

            // Load any scholar voice feedback audio blobs
            const voiceUrls: Record<number, string> = {};
            for (const c of details.comments || []) {
                if (c.audio_comment_path) {
                    try {
                        const cBlob = await apiService.getCommentAudio(c.id);
                        voiceUrls[c.id] = URL.createObjectURL(cBlob);
                    } catch {
                        // Ignore missing comment audio
                    }
                }
            }
            setCommentAudioUrls(voiceUrls);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recitation details');
        }
    };

    const handleToggleResolve = async (commentId: number, current: boolean) => {
        if (!selected) return;
        try {
            const updated = await apiService.resolveComment(commentId, !current);
            setSelected({
                ...selected,
                comments: (selected.comments || []).map((c) =>
                    c.id === commentId ? { ...c, is_resolved: updated.is_resolved } : c,
                ),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update comment');
        }
    };

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-stone-500">Loading your recitations...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">My Recitations &amp; Feedback</h1>
                    <p className="text-sm text-stone-600">
                        Review scholar annotations, jump to timestamps, and mark notes resolved.
                    </p>
                </div>
                <Link
                    to="/record"
                    className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                    + New Recording
                </Link>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!selected ? (
                recitations.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
                        <p className="text-stone-600 mb-4">You haven&apos;t submitted any recitations yet.</p>
                        <Link
                            to="/record"
                            className="inline-block rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white"
                        >
                            Record Your First Recitation
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recitations.map((rec) => (
                            <div
                                key={rec.id}
                                onClick={() => loadDetails(rec.id)}
                                className="cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-600 transition"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-semibold text-stone-900">
                                            {rec.surah_name} ({rec.ayah_start}–{rec.ayah_end})
                                        </h3>
                                        <p className="mt-1 text-xs text-stone-500">
                                            Submitted {new Date(rec.created_at).toLocaleDateString()}
                                            {rec.duration ? ` • ${formatTime(rec.duration)}` : ''}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                                            rec.status,
                                        )}`}
                                    >
                                        {rec.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="mt-4 text-xs font-semibold text-emerald-800">
                                    Open Playback &amp; Feedback →
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-5">
                    <button
                        onClick={() => setSelected(null)}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                        ← Back to My Recitations
                    </button>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">
                                    {selected.surah_name} (Ayah {selected.ayah_start}–{selected.ayah_end})
                                </h2>
                                <p className="text-xs text-stone-500">
                                    Submitted {new Date(selected.created_at).toLocaleString()}
                                </p>
                            </div>
                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadge(
                                    selected.status,
                                )}`}
                            >
                                {selected.status.replace('_', ' ')}
                            </span>
                        </div>

                        {audioUrl ? (
                            <UnifiedWaveformPlayer
                                audioUrl={audioUrl}
                                markers={selected.markers || []}
                                loopRegions={selected.loop_regions || []}
                                externalSeekTime={seekTime}
                                onMarkerClick={(m) => setSeekTime(m.timestamp)}
                            />
                        ) : (
                            <div className="rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
                                Audio file unavailable for this recitation.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Markers */}
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-base font-semibold text-stone-900">
                                Scholar Markers ({selected.markers?.length || 0})
                            </h3>
                            {!selected.markers || selected.markers.length === 0 ? (
                                <p className="text-sm text-stone-500">No markers added yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {selected.markers.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSeekTime(m.timestamp)}
                                            className="flex w-full items-start justify-between rounded-xl border border-stone-100 bg-stone-50 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition"
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-stone-900">
                                                    {m.label}
                                                </div>
                                                {m.description && (
                                                    <div className="mt-0.5 text-xs text-stone-600">
                                                        {m.description}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="ml-3 rounded bg-white px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800 border border-stone-200">
                                                {formatTime(m.timestamp)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-base font-semibold text-stone-900">
                                Scholar Feedback ({selected.comments?.length || 0})
                            </h3>
                            {!selected.comments || selected.comments.length === 0 ? (
                                <p className="text-sm text-stone-500">
                                    {selected.status === 'pending'
                                        ? 'Waiting for scholar review...'
                                        : 'No comments on this recitation.'}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {selected.comments.map((c) => (
                                        <div
                                            key={c.id}
                                            className={`rounded-xl border p-3.5 ${c.is_resolved
                                                ? 'border-stone-200 bg-stone-50/70'
                                                : 'border-emerald-200 bg-emerald-50/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSeekTime(c.timestamp)}
                                                    className="rounded bg-emerald-800 px-2 py-0.5 font-mono text-xs font-semibold text-white hover:bg-emerald-900"
                                                >
                                                    ▶ {formatTime(c.timestamp)}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleResolve(c.id, c.is_resolved)}
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${c.is_resolved
                                                        ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                                                        : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                                                        }`}
                                                >
                                                    {c.is_resolved ? '✓ Resolved' : 'Mark Resolved'}
                                                </button>
                                            </div>
                                            {c.text_comment && (
                                                <p className="mt-2 text-sm text-stone-800">{c.text_comment}</p>
                                            )}
                                            {commentAudioUrls[c.id] && (
                                                <audio
                                                    controls
                                                    src={commentAudioUrls[c.id]}
                                                    className="mt-2 h-9 w-full"
                                                />
                                            )}
                                            <div className="mt-2 text-[11px] text-stone-500">
                                                By {c.scholar?.full_name || c.scholar?.username || 'Scholar'} •{' '}
                                                {new Date(c.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;
