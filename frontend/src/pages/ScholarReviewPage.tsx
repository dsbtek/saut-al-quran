import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RecitationWithDetails } from '../types';
import { apiService } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import UnifiedWaveformPlayer from '../components/UnifiedWaveformPlayer';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ScholarReviewPage: React.FC = () => {
    const { recitationId } = useParams<{ recitationId: string }>();
    const [recitation, setRecitation] = useState<RecitationWithDetails | null>(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [currentTime, setCurrentTime] = useState(0);
    const [seekTime, setSeekTime] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Comment form
    const [commentTimestamp, setCommentTimestamp] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Marker form
    const [markerLabel, setMarkerLabel] = useState('');
    const [markerCategory, setMarkerCategory] = useState('tajweed');
    const [markerTimestamp, setMarkerTimestamp] = useState(0);

    // Loop form
    const [loopLabel, setLoopLabel] = useState('');
    const [loopStart, setLoopStart] = useState(0);
    const [loopEnd, setLoopEnd] = useState(5);

    const {
        isRecording: isRecordingVoice,
        audioBlob: voiceBlob,
        audioURL: voiceUrl,
        startRecording: startVoice,
        stopRecording: stopVoice,
        clearRecording: clearVoice,
    } = useAudioRecorder();

    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (recitationId) {
            loadRecitation(parseInt(recitationId, 10));
        }
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, [recitationId]);

    const loadRecitation = async (id: number) => {
        try {
            setIsLoading(true);
            setError('');
            const data = await apiService.getRecitation(id);
            setRecitation(data);

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            if (data.audio_file_path) {
                const blob = await apiService.getRecitationAudio(id);
                const url = URL.createObjectURL(blob);
                objectUrlRef.current = url;
                setAudioUrl(url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recitation || (!commentText.trim() && !voiceBlob)) return;

        setIsSubmittingComment(true);
        try {
            const created = await apiService.createCommentWithAudio({
                recitation_id: recitation.id,
                timestamp: commentTimestamp,
                text_comment: commentText.trim() || undefined,
                audioBlob: voiceBlob || undefined,
            });
            setRecitation({
                ...recitation,
                comments: [...(recitation.comments || []), created],
            });
            setCommentText('');
            clearVoice();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAddMarker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recitation || !markerLabel.trim()) return;

        const colorMap: Record<string, string> = {
            pronunciation: '#ef4444',
            tajweed: '#059669',
            rhythm: '#3b82f6',
            general: '#d97706',
        };

        try {
            const created = await apiService.createMarker({
                recitation_id: recitation.id,
                timestamp: markerTimestamp,
                label: markerLabel.trim(),
                category: markerCategory,
                color: colorMap[markerCategory] || '#d97706',
            });
            setRecitation({
                ...recitation,
                markers: [...(recitation.markers || []), created],
            });
            setMarkerLabel('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add marker');
        }
    };

    const handleDeleteMarker = async (markerId: number) => {
        if (!recitation) return;
        try {
            await apiService.deleteMarker(markerId);
            setRecitation({
                ...recitation,
                markers: (recitation.markers || []).filter((m) => m.id !== markerId),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete marker');
        }
    };

    const handleAddLoop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recitation || !loopLabel.trim() || loopStart >= loopEnd) return;
        try {
            const created = await apiService.createLoopRegion({
                recitation_id: recitation.id,
                start_time: loopStart,
                end_time: loopEnd,
                label: loopLabel.trim(),
            });
            setRecitation({
                ...recitation,
                loop_regions: [...(recitation.loop_regions || []), created],
            });
            setLoopLabel('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create loop region');
        }
    };

    const handleStatusChange = async (status: 'reviewed' | 'needs_revision' | 'pending') => {
        if (!recitation) return;
        try {
            const updated = await apiService.updateRecitationStatus(recitation.id, status);
            setRecitation({ ...recitation, status: updated.status });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-stone-500">Loading review workspace...</div>;
    }

    if (!recitation) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                <p className="text-stone-600 mb-3">Recitation not found.</p>
                <Link to="/scholar" className="text-sm font-semibold text-emerald-800 hover:underline">
                    ← Back to Scholar Queue
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    to="/scholar"
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                    ← Back to Queue
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-stone-500 mr-1">Set Status:</span>
                    <button
                        type="button"
                        onClick={() => handleStatusChange('reviewed')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                            recitation.status === 'reviewed'
                                ? 'bg-emerald-800 text-white border-emerald-800'
                                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                        ✓ Mark Reviewed
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusChange('needs_revision')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                            recitation.status === 'needs_revision'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                        }`}
                    >
                        ↻ Needs Revision
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-stone-900">
                        {recitation.surah_name} (Ayah {recitation.ayah_start}–{recitation.ayah_end})
                    </h1>
                    <p className="text-xs text-stone-500">
                        Student: {recitation.user?.full_name || recitation.user?.username} • Submitted{' '}
                        {new Date(recitation.created_at).toLocaleString()}
                    </p>
                </div>

                {audioUrl ? (
                    <UnifiedWaveformPlayer
                        audioUrl={audioUrl}
                        markers={recitation.markers || []}
                        loopRegions={recitation.loop_regions || []}
                        externalSeekTime={seekTime}
                        onTimeUpdate={(t) => setCurrentTime(t)}
                        onMarkerClick={(m) => {
                            setSeekTime(m.timestamp);
                            setCommentTimestamp(Number(m.timestamp.toFixed(1)));
                        }}
                        onAddMarkerAtTime={(t) => {
                            setMarkerTimestamp(Number(t.toFixed(1)));
                            setCommentTimestamp(Number(t.toFixed(1)));
                        }}
                    />
                ) : (
                    <div className="rounded-lg bg-stone-50 p-4 text-sm text-stone-500">
                        No audio available for this recitation.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 cols: Comment composer + comments list */}
                <div className="lg:col-span-2 space-y-5">
                    <form
                        onSubmit={handleAddComment}
                        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-stone-900">
                                Add Timestamped Feedback
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCommentTimestamp(Number(currentTime.toFixed(1)))}
                                className="text-xs font-semibold text-emerald-800 hover:underline"
                            >
                                Use current time ({formatTime(currentTime)})
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-xs font-medium text-stone-600">Timestamp (sec):</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={commentTimestamp}
                                onChange={(e) => setCommentTimestamp(parseFloat(e.target.value) || 0)}
                                className="w-24 rounded-lg border border-stone-300 px-2.5 py-1 text-sm"
                            />
                        </div>

                        <textarea
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write Tajweed or pronunciation guidance..."
                            className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-emerald-700 focus:outline-none"
                        />

                        {/* Optional voice feedback */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 border border-stone-100">
                            <div className="flex items-center gap-2">
                                {!isRecordingVoice ? (
                                    <button
                                        type="button"
                                        onClick={startVoice}
                                        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                                    >
                                        🎤 Record Voice Note
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={stopVoice}
                                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        ⏹ Stop Voice Note
                                    </button>
                                )}
                                {voiceUrl && (
                                    <>
                                        <audio controls src={voiceUrl} className="h-8 max-w-[200px]" />
                                        <button
                                            type="button"
                                            onClick={clearVoice}
                                            className="text-xs text-red-600 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingComment || (!commentText.trim() && !voiceBlob)}
                                className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                            >
                                {isSubmittingComment ? 'Saving...' : 'Post Feedback'}
                            </button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-base font-semibold text-stone-900">
                            Comments ({recitation.comments?.length || 0})
                        </h3>
                        {!recitation.comments || recitation.comments.length === 0 ? (
                            <p className="text-sm text-stone-500">No comments added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {recitation.comments.map((c) => (
                                    <div key={c.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3.5">
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setSeekTime(c.timestamp)}
                                                className="rounded bg-emerald-800 px-2 py-0.5 font-mono text-xs font-semibold text-white"
                                            >
                                                ▶ {formatTime(c.timestamp)}
                                            </button>
                                            <span className="text-xs text-stone-500">
                                                {c.is_resolved ? '✓ Resolved by student' : 'Open'}
                                            </span>
                                        </div>
                                        {c.text_comment && (
                                            <p className="mt-2 text-sm text-stone-800">{c.text_comment}</p>
                                        )}
                                        {c.audio_comment_path && (
                                            <p className="mt-1 text-xs text-emerald-700 font-medium">
                                                🔊 Voice feedback attached
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right col: Markers & Practice Loops */}
                <div className="space-y-5">
                    <form
                        onSubmit={handleAddMarker}
                        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                    >
                        <h3 className="text-base font-semibold text-stone-900">Add Marker</h3>
                        <input
                            type="text"
                            value={markerLabel}
                            onChange={(e) => setMarkerLabel(e.target.value)}
                            placeholder="Label (e.g. Ghunnah, Madd)"
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={markerTimestamp}
                                onChange={(e) => setMarkerTimestamp(parseFloat(e.target.value) || 0)}
                                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                            />
                            <select
                                value={markerCategory}
                                onChange={(e) => setMarkerCategory(e.target.value)}
                                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm"
                            >
                                <option value="tajweed">Tajweed</option>
                                <option value="pronunciation">Pronunciation</option>
                                <option value="rhythm">Rhythm</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                        >
                            + Save Marker
                        </button>

                        {recitation.markers && recitation.markers.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                {recitation.markers.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSeekTime(m.timestamp)}
                                            className="font-medium text-stone-800 hover:text-emerald-800 text-left"
                                        >
                                            [{formatTime(m.timestamp)}] {m.label}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMarker(m.id)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>

                    <form
                        onSubmit={handleAddLoop}
                        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                    >
                        <h3 className="text-base font-semibold text-stone-900">Add Practice Loop</h3>
                        <input
                            type="text"
                            value={loopLabel}
                            onChange={(e) => setLoopLabel(e.target.value)}
                            placeholder="Loop label (e.g. Ayah 3 repeat)"
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={loopStart}
                                onChange={(e) => setLoopStart(parseFloat(e.target.value) || 0)}
                                placeholder="Start (s)"
                                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                            />
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={loopEnd}
                                onChange={(e) => setLoopEnd(parseFloat(e.target.value) || 0)}
                                placeholder="End (s)"
                                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-stone-900 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                        >
                            🔁 Save Practice Loop
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ScholarReviewPage;
