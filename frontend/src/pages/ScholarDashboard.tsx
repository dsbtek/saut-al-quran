import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RecitationWithDetails } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import WaveformPlayer from '../components/WaveformPlayer';

const ScholarDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingRecitations, setPendingRecitations] = useState<
        RecitationWithDetails[]
    >([]);
    const [selectedRecitation, setSelectedRecitation] =
        useState<RecitationWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentForm, setCommentForm] = useState({
        timestamp: 0,
        text_comment: '',
    });
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        if (user?.role === 'scholar' || user?.role === 'admin') {
            loadPendingRecitations();
        }
    }, [user]);

    const loadPendingRecitations = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getPendingRecitations();
            setPendingRecitations(data);
        } catch (err) {
            setError('Failed to load pending recitations');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecitationSelect = (recitation: RecitationWithDetails) => {
        setSelectedRecitation(recitation);
        setCommentForm({ timestamp: 0, text_comment: '' });
    };

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

            // Update the selected recitation with the new comment
            setSelectedRecitation({
                ...selectedRecitation,
                comments: [...(selectedRecitation.comments || []), newComment],
            });

            // Clear the form
            setCommentForm({ timestamp: 0, text_comment: '' });

            alert('Comment added successfully!');
        } catch (err) {
            console.error('Failed to add comment:', err);
            alert('Failed to add comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const getAudioUrl = (recitation: RecitationWithDetails) => {
        if (recitation.audio_file_path) {
            return `${import.meta.env.REACT_APP_API_URL}/files/${
                recitation.audio_file_path
            }`;
        } else if (recitation.audio_data) {
            return `data:audio/webm;base64,${recitation.audio_data}`;
        }
        return '';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (user?.role !== 'scholar' && user?.role !== 'admin') {
        return (
            <div className="page-container">
                <h2>Access Denied</h2>
                <p>
                    You don't have permission to access the scholar dashboard.
                </p>
                <Link to="/" className="nav-btn">
                    ← Back to Home
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h2>Scholar Dashboard</h2>

            <div style={{ marginBottom: '20px' }}>
                <Link to="/" className="nav-btn">
                    ← Back to Home
                </Link>
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
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>
                                        {recitation.user?.full_name ||
                                            recitation.user?.username ||
                                            'Unknown Student'}
                                    </h4>
                                    <p style={{ margin: '0', color: '#666' }}>
                                        {recitation.surah_name} (
                                        {recitation.ayah_start}-
                                        {recitation.ayah_end})
                                        {recitation.duration &&
                                            ` - ${formatTime(
                                                recitation.duration,
                                            )}`}
                                    </p>
                                    <p
                                        style={{
                                            margin: '5px 0 0 0',
                                            fontSize: '14px',
                                            color: '#888',
                                        }}
                                    >
                                        Submitted:{' '}
                                        {new Date(
                                            recitation.created_at,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginRight: '10px' }}
                                        onClick={() =>
                                            handleRecitationSelect(recitation)
                                        }
                                    >
                                        🎧 Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {pendingRecitations.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#666',
                            }}
                        >
                            <p>No pending reviews at the moment.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <button
                            onClick={() => setSelectedRecitation(null)}
                            className="btn btn-secondary"
                        >
                            ← Back to List
                        </button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3>
                            {selectedRecitation.surah_name} (
                            {selectedRecitation.ayah_start}-
                            {selectedRecitation.ayah_end})
                        </h3>
                        <p style={{ color: '#666' }}>
                            Student:{' '}
                            {selectedRecitation.user?.full_name ||
                                selectedRecitation.user?.username}{' '}
                            | Submitted:{' '}
                            {new Date(
                                selectedRecitation.created_at,
                            ).toLocaleString()}
                        </p>
                    </div>

                    {getAudioUrl(selectedRecitation) && (
                        <div style={{ marginBottom: '30px' }}>
                            <h4>Audio Review</h4>
                            <WaveformPlayer
                                audioUrl={getAudioUrl(selectedRecitation)}
                                markers={selectedRecitation.markers || []}
                                onMarkerClick={(marker) => {
                                    setCommentForm({
                                        ...commentForm,
                                        timestamp: marker.timestamp,
                                    });
                                }}
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
                        <div>
                            <h4>Add Comment</h4>
                            <form
                                onSubmit={handleCommentSubmit}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    padding: '15px',
                                }}
                            >
                                <div style={{ marginBottom: '15px' }}>
                                    <label>Timestamp (seconds):</label>
                                    <input
                                        type="number"
                                        value={commentForm.timestamp}
                                        onChange={(e) =>
                                            setCommentForm({
                                                ...commentForm,
                                                timestamp:
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                            })
                                        }
                                        min="0"
                                        step="0.1"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label>Comment:</label>
                                    <textarea
                                        value={commentForm.text_comment}
                                        onChange={(e) =>
                                            setCommentForm({
                                                ...commentForm,
                                                text_comment: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        placeholder="Provide feedback on pronunciation, tajweed, etc..."
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            marginTop: '5px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            resize: 'vertical',
                                        }}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        isSubmittingComment ||
                                        !commentForm.text_comment.trim()
                                    }
                                    style={{ width: '100%' }}
                                >
                                    {isSubmittingComment
                                        ? 'Adding Comment...'
                                        : 'Add Comment'}
                                </button>
                            </form>
                        </div>

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
                                {(selectedRecitation.comments || []).length ===
                                0 ? (
                                    <div
                                        style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: '#666',
                                        }}
                                    >
                                        No comments yet.
                                    </div>
                                ) : (
                                    (selectedRecitation.comments || []).map(
                                        (comment) => (
                                            <div
                                                key={comment.id}
                                                style={{
                                                    padding: '15px',
                                                    borderBottom:
                                                        '1px solid #eee',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        marginBottom: '5px',
                                                    }}
                                                >
                                                    <strong>
                                                        [
                                                        {formatTime(
                                                            comment.timestamp,
                                                        )}
                                                        ]
                                                    </strong>
                                                    <span
                                                        style={{
                                                            marginLeft: '10px',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                        }}
                                                    >
                                                        by{' '}
                                                        {comment.scholar
                                                            ?.full_name ||
                                                            comment.scholar
                                                                ?.username ||
                                                            'Scholar'}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        marginBottom: '10px',
                                                    }}
                                                >
                                                    {comment.text_comment}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                        color: '#666',
                                                    }}
                                                >
                                                    {new Date(
                                                        comment.created_at,
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                        ),
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                }}
            >
                <h4>Review Guidelines:</h4>
                <ul>
                    <li>
                        Listen to the complete recitation before providing
                        feedback
                    </li>
                    <li>Focus on Tajweed rules and pronunciation</li>
                    <li>Provide constructive and encouraging feedback</li>
                    <li>Use timestamps to reference specific parts</li>
                    <li>Consider the student's level and progress</li>
                    <li>
                        Click on markers in the waveform to set comment
                        timestamps
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ScholarDashboard;
