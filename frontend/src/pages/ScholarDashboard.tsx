import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RecitationWithDetails } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ScholarWaveformPlayer from '../components/ScholarWaveformPlayer';

const ScholarDashboard: React.FC = () => {
    const { user } = useAuth();

    const [pendingRecitations, setPendingRecitations] = useState<RecitationWithDetails[]>([]);
    const [selectedRecitation, setSelectedRecitation] = useState<RecitationWithDetails | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [commentForm, setCommentForm] = useState({
        timestamp: 0,
        text_comment: '',
    });

    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [audioSrc, setAudioSrc] = useState<string>('');

    const audioFetchController = useRef<AbortController | null>(null);
    const prevBlobUrl = useRef<string | null>(null);

    // ----------------------------------------------------
    // Load pending recitations
    // ----------------------------------------------------
    useEffect(() => {
        if (user?.role === 'scholar' || user?.role === 'admin') {
            (async () => {
                try {
                    setIsLoading(true);
                    const data = await apiService.getPendingRecitations();
                    setPendingRecitations(data);
                } catch (err) {
                    console.error(err);
                    setError('Failed to load pending recitations');
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [user]);

    // ----------------------------------------------------
    // Select recitation
    // ----------------------------------------------------
    const handleRecitationSelect = (recitation: RecitationWithDetails) => {
        setSelectedRecitation(recitation);
        setCommentForm({ timestamp: 0, text_comment: '' });
    };

    // ----------------------------------------------------
    // Clean URL + AbortController on unmount
    // ----------------------------------------------------
    useEffect(() => {
        return () => {
            if (audioFetchController.current) {
                audioFetchController.current.abort();
            }
            if (prevBlobUrl.current) {
                URL.revokeObjectURL(prevBlobUrl.current);
            }
        };
    }, []);

    // ----------------------------------------------------
    // Fetch Audio (refactored + stable)
    // ----------------------------------------------------
    const fetchAudio = useCallback(async (recitation: RecitationWithDetails) => {
        // Cancel ongoing request
        if (audioFetchController.current) {
            audioFetchController.current.abort();
        }
        audioFetchController.current = new AbortController();

        // Cleanup previous blob URL
        if (prevBlobUrl.current) {
            URL.revokeObjectURL(prevBlobUrl.current);
            prevBlobUrl.current = null;
        }

        // Base64 inline audio
        if (recitation.audio_data) {
            setAudioSrc(`data:audio/webm;base64,${recitation.audio_data}`);
            return;
        }

        // No audio path
        if (!recitation.audio_file_path) {
            setAudioSrc('');
            return;
        }

        try {
            const blob = await apiService.getRecitationAudio(recitation.id);
            const url = URL.createObjectURL(blob);
            prevBlobUrl.current = url;

            setAudioSrc(url);
        } catch (err) {
            console.error('Failed to fetch audio:', err);
            setAudioSrc('');
        }
    }, []);

    // ----------------------------------------------------
    // Trigger fetchAudio when recitation changes
    // ----------------------------------------------------
    useEffect(() => {
        if (selectedRecitation) {
            fetchAudio(selectedRecitation);
        } else {
            setAudioSrc('');
        }

        return () => {
            if (audioFetchController.current) {
                audioFetchController.current.abort();
            }
        };
    }, [selectedRecitation, fetchAudio]);

    // ----------------------------------------------------
    // Submit Comment
    // ----------------------------------------------------
    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecitation || !commentForm.text_comment.trim()) return;

        setIsSubmittingComment(true);

        try {
            const newComment = await apiService.createComment({
                recitation_id: selectedRecitation.id,
                timestamp: commentForm.timestamp,
                text_comment: commentForm.text_comment,
            });

            setSelectedRecitation({
                ...selectedRecitation,
                comments: [...(selectedRecitation.comments || []), newComment],
            });

            setCommentForm({ timestamp: 0, text_comment: '' });
            alert('Comment added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ----------------------------------------------------
    // Access Control
    // ----------------------------------------------------
    if (user?.role !== 'scholar' && user?.role !== 'admin') {
        return (
            <div className="page-container">
                <h2>Access Denied</h2>
                <p>You don't have permission to access the scholar dashboard.</p>
                <Link to="/" className="nav-btn">← Back to Home</Link>
            </div>
        );
    }

    // ----------------------------------------------------
    // Loading
    // ----------------------------------------------------
    if (isLoading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
            </div>
        );
    }

    // ----------------------------------------------------
    // MAIN UI
    // ----------------------------------------------------
    return (
        <div className="page-container">
            <h2>Scholar Dashboard</h2>

            <div style={{ marginBottom: '20px' }}>
                <Link to="/" className="nav-btn">← Back to Home</Link>
            </div>

            {error && (
                <div
                    style={{
                        color: 'red',
                        backgroundColor: '#ffebee',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {/* ------------------------- LIST VIEW ------------------------- */}
            {!selectedRecitation ? (
                <div style={{ textAlign: 'left' }}>
                    <h3>Pending Reviews ({pendingRecitations.length})</h3>

                    {pendingRecitations.map((recitation) => (
                        <div
                            key={recitation.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '15px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>
                                        {recitation.user?.full_name ||
                                            recitation.user?.username ||
                                            'Unknown Student'}
                                    </h4>
                                    <p style={{ margin: '0', color: '#666' }}>
                                        {recitation.surah_name} ({recitation.ayah_start}-{recitation.ayah_end})
                                        {recitation.duration && ` - ${formatTime(recitation.duration)}`}
                                    </p>
                                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#888' }}>
                                        Submitted: {new Date(recitation.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleRecitationSelect(recitation)}
                                >
                                    🎧 Review
                                </button>
                            </div>
                        </div>
                    ))}

                    {pendingRecitations.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            No pending reviews at the moment.
                        </div>
                    )}
                </div>
            ) : (
                /* ------------------------- REVIEW VIEW ------------------------- */
                <div>
                    <button
                        onClick={() => setSelectedRecitation(null)}
                        className="btn btn-secondary"
                        style={{ marginBottom: '20px' }}
                    >
                        ← Back to List
                    </button>

                    <h3>
                        {selectedRecitation.surah_name} ({selectedRecitation.ayah_start}-
                        {selectedRecitation.ayah_end})
                    </h3>
                    <p style={{ color: '#666' }}>
                        Student: {selectedRecitation.user?.full_name || selectedRecitation.user?.username}{' '}
                        | Submitted: {new Date(selectedRecitation.created_at).toLocaleString()}
                    </p>

                    {audioSrc && (
                        <div style={{ marginBottom: '30px' }}>
                            <h4>Audio Review with Advanced Tools</h4>

                            <ScholarWaveformPlayer
                                audioUrl={audioSrc}
                                markers={selectedRecitation.markers || []}
                                onMarkerClick={(m) => setCommentForm((f) => ({ ...f, timestamp: m.timestamp }))}
                                onMarkerAdd={(t) => setCommentForm((f) => ({ ...f, timestamp: t }))}
                                onTimeUpdate={(t) => setCommentForm((f) => ({ ...f, timestamp: t }))}
                                height={150}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            marginBottom: '30px',
                        }}
                    >
                        {/* Add Comment */}
                        <div>
                            <h4>Add Comment</h4>

                            <form
                                onSubmit={handleCommentSubmit}
                                style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}
                            >
                                <label>Timestamp (seconds):</label>
                                <input
                                    type="number"
                                    value={commentForm.timestamp}
                                    onChange={(e) =>
                                        setCommentForm({
                                            ...commentForm,
                                            timestamp: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    min="0"
                                    step="0.1"
                                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                />

                                <label style={{ marginTop: '15px' }}>Comment:</label>
                                <textarea
                                    value={commentForm.text_comment}
                                    onChange={(e) =>
                                        setCommentForm({ ...commentForm, text_comment: e.target.value })
                                    }
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginTop: '5px',
                                        resize: 'vertical',
                                    }}
                                />

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmittingComment || !commentForm.text_comment.trim()}
                                    style={{ width: '100%', marginTop: '15px' }}
                                >
                                    {isSubmittingComment ? 'Adding Comment...' : 'Add Comment'}
                                </button>
                            </form>
                        </div>

                        {/* Comments List */}
                        <div>
                            <h4>Existing Comments</h4>
                            <div
                                style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                {(selectedRecitation.comments || []).length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        No comments yet.
                                    </div>
                                ) : (
                                    selectedRecitation.comments!.map((comment) => (
                                        <div key={comment.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                            <strong>[{formatTime(comment.timestamp)}]</strong>
                                            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                                                by {comment.scholar?.full_name || comment.scholar?.username}
                                            </span>

                                            <div style={{ marginTop: '5px' }}>{comment.text_comment}</div>

                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                {new Date(comment.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa' }}>
                        <h4>Review Guidelines:</h4>
                        <ul>
                            <li>Listen to the full recitation before giving feedback</li>
                            <li>Focus on Tajweed and pronunciation accuracy</li>
                            <li>Provide constructive comments</li>
                            <li>Use timestamps to reference specific issues</li>
                            <li>Click markers to set comment timestamps</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScholarDashboard;
