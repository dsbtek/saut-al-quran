import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractiveWaveform from '../components/InteractiveWaveform';
import MarkerManager, { Marker, LoopRegion } from '../components/MarkerManager';

interface Recitation {
    id: number;
    user_id: number;
    surah: string;
    ayah_range: string;
    audio_url: string;
    status: 'pending' | 'in_review' | 'reviewed';
    submitted_at: string;
    user: {
        username: string;
        full_name: string;
    };
}

interface Comment {
    id: string;
    timestamp: number;
    text: string;
    audio_url?: string;
    type: 'text' | 'audio';
    created_at: string;
}

const ScholarReviewPage: React.FC = () => {
    const { recitationId } = useParams<{ recitationId: string }>();
    const [recitation, setRecitation] = useState<Recitation | null>(null);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [loopRegions, setLoopRegions] = useState<LoopRegion[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [newComment, setNewComment] = useState({
        timestamp: 0,
        text: '',
        type: 'text' as const
    });

    // Mock data - replace with actual API calls
    useEffect(() => {
        const loadRecitation = async () => {
            setIsLoading(true);
            try {
                // Mock recitation data
                const mockRecitation: Recitation = {
                    id: parseInt(recitationId || '1'),
                    user_id: 1,
                    surah: 'Al-Fatiha',
                    ayah_range: '1-7',
                    audio_url: '/api/audio/sample-recitation.mp3', // Mock audio URL
                    status: 'in_review',
                    submitted_at: '2024-01-15T10:30:00Z',
                    user: {
                        username: 'student123',
                        full_name: 'Ahmad Ali'
                    }
                };

                setRecitation(mockRecitation);
                
                // Mock existing markers
                setMarkers([
                    {
                        id: '1',
                        time: 15.5,
                        label: 'Pronunciation Issue',
                        description: 'The "ر" sound needs improvement',
                        category: 'pronunciation',
                        color: '#ef4444'
                    },
                    {
                        id: '2',
                        time: 32.2,
                        label: 'Good Tajweed',
                        description: 'Excellent elongation here',
                        category: 'tajweed',
                        color: '#10b981'
                    }
                ]);

                // Mock existing comments
                setComments([
                    {
                        id: '1',
                        timestamp: 15.5,
                        text: 'Please pay attention to the pronunciation of "الرحمن". The "ر" should be rolled more clearly.',
                        type: 'text',
                        created_at: '2024-01-15T11:00:00Z'
                    }
                ]);

            } catch (error) {
                console.error('Error loading recitation:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (recitationId) {
            loadRecitation();
        }
    }, [recitationId]);

    const handleMarkerAdd = useCallback((markerData: Omit<Marker, 'id'>) => {
        const newMarker: Marker = {
            ...markerData,
            id: Date.now().toString()
        };
        setMarkers(prev => [...prev, newMarker]);
    }, []);

    const handleMarkerUpdate = useCallback((id: string, updates: Partial<Marker>) => {
        setMarkers(prev => prev.map(marker => 
            marker.id === id ? { ...marker, ...updates } : marker
        ));
    }, []);

    const handleMarkerDelete = useCallback((id: string) => {
        setMarkers(prev => prev.filter(marker => marker.id !== id));
    }, []);

    const handleLoopRegionAdd = useCallback((regionData: Omit<LoopRegion, 'id'>) => {
        const newRegion: LoopRegion = {
            ...regionData,
            id: Date.now().toString(),
            isActive: false
        };
        setLoopRegions(prev => [...prev, newRegion]);
    }, []);

    const handleLoopRegionUpdate = useCallback((id: string, updates: Partial<LoopRegion>) => {
        setLoopRegions(prev => prev.map(region => 
            region.id === id ? { ...region, ...updates } : region
        ));
    }, []);

    const handleLoopRegionDelete = useCallback((id: string) => {
        setLoopRegions(prev => prev.filter(region => region.id !== id));
        if (activeLoopId === id) {
            setActiveLoopId(null);
        }
    }, [activeLoopId]);

    const handleLoopToggle = useCallback((regionId: string) => {
        if (activeLoopId === regionId) {
            setActiveLoopId(null);
            setLoopRegions(prev => prev.map(region => 
                region.id === regionId ? { ...region, isActive: false } : region
            ));
        } else {
            setActiveLoopId(regionId);
            setLoopRegions(prev => prev.map(region => ({
                ...region,
                isActive: region.id === regionId
            })));
        }
    }, [activeLoopId]);

    const handleSeekTo = useCallback((time: number) => {
        // This would be handled by the waveform component
        setCurrentTime(time);
    }, []);

    const handleAddComment = () => {
        if (newComment.text.trim()) {
            const comment: Comment = {
                id: Date.now().toString(),
                timestamp: newComment.timestamp,
                text: newComment.text.trim(),
                type: newComment.type,
                created_at: new Date().toISOString()
            };
            setComments(prev => [...prev, comment]);
            setNewComment({
                timestamp: currentTime,
                text: '',
                type: 'text'
            });
            setShowCommentForm(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!recitation) return;

        try {
            // Mock API call to submit review
            console.log('Submitting review with:', {
                recitationId: recitation.id,
                markers,
                comments,
                loopRegions
            });

            // Update recitation status
            setRecitation(prev => prev ? { ...prev, status: 'reviewed' } : null);
            
            alert('Review submitted successfully!');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Error submitting review. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading recitation...</p>
            </div>
        );
    }

    if (!recitation) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Recitation not found</p>
                <Link to="/scholar">← Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <Link 
                    to="/scholar" 
                    style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#f8f9fa',
                        color: '#007bff',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        border: '1px solid #007bff',
                        marginBottom: '16px'
                    }}
                >
                    ← Back to Scholar Dashboard
                </Link>

                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '20px'
                }}>
                    <h1 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                        Review Recitation: {recitation.surah} ({recitation.ayah_range})
                    </h1>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <strong>Student:</strong> {recitation.user.full_name} (@{recitation.user.username})
                        </div>
                        <div>
                            <strong>Submitted:</strong> {new Date(recitation.submitted_at).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>Status:</strong> 
                            <span style={{ 
                                marginLeft: '8px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: recitation.status === 'reviewed' ? '#d1fae5' : '#fef3c7',
                                color: recitation.status === 'reviewed' ? '#065f46' : '#92400e'
                            }}>
                                {recitation.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Left Column - Waveform and Comments */}
                <div>
                    {/* Waveform */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Audio Waveform</h3>
                        <InteractiveWaveform
                            audioUrl={recitation.audio_url}
                            markers={markers}
                            onMarkerAdd={(time) => handleMarkerAdd({
                                time,
                                label: 'New Marker',
                                category: 'general',
                                color: '#f59e0b'
                            })}
                            onMarkerClick={(marker) => handleSeekTo(marker.time)}
                            onTimeUpdate={setCurrentTime}
                            height={150}
                        />
                    </div>

                    {/* Comments Section */}
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '20px', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>Comments ({comments.length})</h3>
                            <button
                                onClick={() => {
                                    setNewComment(prev => ({ ...prev, timestamp: currentTime }));
                                    setShowCommentForm(true);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                + Add Comment
                            </button>
                        </div>

                        {/* Add Comment Form */}
                        {showCommentForm && (
                            <div style={{ 
                                backgroundColor: '#f9fafb', 
                                padding: '16px', 
                                borderRadius: '6px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                        Timestamp: {Math.floor(newComment.timestamp / 60)}:{Math.floor(newComment.timestamp % 60).toString().padStart(2, '0')}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration}
                                        step="0.1"
                                        value={newComment.timestamp}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, timestamp: parseFloat(e.target.value) }))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <textarea
                                    placeholder="Enter your comment..."
                                    value={newComment.text}
                                    onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                                    style={{ 
                                        width: '100%', 
                                        padding: '8px 12px', 
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button
                                        onClick={handleAddComment}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Add Comment
                                    </button>
                                    <button
                                        onClick={() => setShowCommentForm(false)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Comments List */}
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {comments.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                    No comments added yet
                                </p>
                            ) : (
                                comments.map(comment => (
                                    <div
                                        key={comment.id}
                                        style={{
                                            padding: '12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            marginBottom: '8px',
                                            backgroundColor: '#fafafa'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ 
                                                fontSize: '12px', 
                                                color: '#6b7280',
                                                backgroundColor: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                border: '1px solid #d1d5db'
                                            }}>
                                                {Math.floor(comment.timestamp / 60)}:{Math.floor(comment.timestamp % 60).toString().padStart(2, '0')}
                                            </span>
                                            <button
                                                onClick={() => handleSeekTo(comment.timestamp)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Go to Time
                                            </button>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                                            {comment.text}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Markers and Controls */}
                <div>
                    <MarkerManager
                        markers={markers}
                        loopRegions={loopRegions}
                        duration={duration}
                        currentTime={currentTime}
                        onMarkerAdd={handleMarkerAdd}
                        onMarkerUpdate={handleMarkerUpdate}
                        onMarkerDelete={handleMarkerDelete}
                        onLoopRegionAdd={handleLoopRegionAdd}
                        onLoopRegionUpdate={handleLoopRegionUpdate}
                        onLoopRegionDelete={handleLoopRegionDelete}
                        onSeekTo={handleSeekTo}
                        onLoopToggle={handleLoopToggle}
                    />

                    {/* Submit Review */}
                    <div style={{ marginTop: '20px' }}>
                        <button
                            onClick={handleSubmitReview}
                            disabled={recitation.status === 'reviewed'}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: recitation.status === 'reviewed' ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: recitation.status === 'reviewed' ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}
                        >
                            {recitation.status === 'reviewed' ? '✓ Review Completed' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScholarReviewPage;
