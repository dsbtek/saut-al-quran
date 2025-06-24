import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Recitation, Comment, Marker } from '../types';
import { apiService } from '../services/api';
import WaveformPlayer from '../components/WaveformPlayer';
import MarkerList from '../components/MarkerList';

const FeedbackPage: React.FC = () => {
    const [recitations, setRecitations] = useState<Recitation[]>([]);
    const [selectedRecitation, setSelectedRecitation] =
        useState<Recitation | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadRecitations();
    }, []);

    const loadRecitations = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getRecitations();
            setRecitations(data);
        } catch (err) {
            setError('Failed to load recitations');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRecitationDetails = async (recitation: Recitation) => {
        try {
            setSelectedRecitation(recitation);

            // Load comments
            const commentsData = await apiService.getCommentsForRecitation(
                recitation.id,
            );
            setComments(commentsData);

            // Load markers
            const markersData = await apiService.getMarkersForRecitation(
                recitation.id,
            );
            setMarkers(markersData);
        } catch (err) {
            console.error('Failed to load recitation details:', err);
        }
    };

    const handleMarkerAdd = async (timestamp: number) => {
        if (!selectedRecitation) return;

        const label = prompt('Enter marker label:');
        if (!label) return;

        const description =
            prompt('Enter description (optional):') || undefined;

        try {
            const newMarker = await apiService.createMarker({
                recitation_id: selectedRecitation.id,
                timestamp,
                label,
                description,
            });
            setMarkers([...markers, newMarker]);
        } catch (err) {
            console.error('Failed to create marker:', err);
            alert('Failed to create marker');
        }
    };

    const handleMarkerClick = (marker: Marker) => {
        // This would seek the audio to the marker timestamp
        console.log('Jump to marker:', marker);
    };

    const getAudioUrl = (recitation: Recitation) => {
        if (recitation.audio_file_path) {
            return `${import.meta.env.REACT_APP_API_URL}/files/${
                recitation.audio_file_path
            }`;
        } else if (recitation.audio_data) {
            return `data:audio/webm;base64,${recitation.audio_data}`;
        }
        return '';
    };

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
            <h2>Your Feedback</h2>

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
                    <h3>Your Recitations</h3>
                    {recitations.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#666',
                            }}
                        >
                            <p>No recordings submitted yet.</p>
                            <Link to="/record" className="btn btn-primary">
                                Record Your First Recitation
                            </Link>
                        </div>
                    ) : (
                        recitations.map((recitation) => (
                            <div
                                key={recitation.id}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    backgroundColor:
                                        recitation.status === 'reviewed'
                                            ? '#f8fff8'
                                            : '#fff8f0',
                                    cursor: 'pointer',
                                }}
                                onClick={() =>
                                    loadRecitationDetails(recitation)
                                }
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <h3 style={{ margin: 0 }}>
                                        {recitation.surah_name} (
                                        {recitation.ayah_start}-
                                        {recitation.ayah_end})
                                    </h3>
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor:
                                                recitation.status === 'reviewed'
                                                    ? '#d4edda'
                                                    : '#fff3cd',
                                            color:
                                                recitation.status === 'reviewed'
                                                    ? '#155724'
                                                    : '#856404',
                                        }}
                                    >
                                        {recitation.status}
                                    </span>
                                </div>

                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    Submitted:{' '}
                                    {new Date(
                                        recitation.created_at,
                                    ).toLocaleDateString()}
                                    {recitation.duration &&
                                        ` | Duration: ${Math.floor(
                                            recitation.duration / 60,
                                        )}:${Math.floor(
                                            recitation.duration % 60,
                                        )
                                            .toString()
                                            .padStart(2, '0')}`}
                                </p>

                                <div style={{ marginTop: '10px' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            loadRecitationDetails(recitation);
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
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
                            Status: {selectedRecitation.status} | Submitted:{' '}
                            {new Date(
                                selectedRecitation.created_at,
                            ).toLocaleDateString()}
                        </p>
                    </div>

                    {getAudioUrl(selectedRecitation) && (
                        <div style={{ marginBottom: '30px' }}>
                            <h4>Audio Playback</h4>
                            <WaveformPlayer
                                audioUrl={getAudioUrl(selectedRecitation)}
                                markers={markers}
                                onMarkerAdd={handleMarkerAdd}
                                onMarkerClick={handleMarkerClick}
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
                            <h4>Your Markers</h4>
                            <MarkerList
                                markers={markers}
                                onMarkerClick={handleMarkerClick}
                            />
                        </div>

                        <div>
                            <h4>Scholar Comments</h4>
                            <div
                                style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                {comments.length === 0 ? (
                                    <div
                                        style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: '#666',
                                        }}
                                    >
                                        {selectedRecitation.status === 'pending'
                                            ? 'Waiting for scholar review...'
                                            : 'No comments yet.'}
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            style={{
                                                padding: '15px',
                                                borderBottom: '1px solid #eee',
                                                backgroundColor:
                                                    comment.is_resolved
                                                        ? '#f8f9fa'
                                                        : '#fff',
                                            }}
                                        >
                                            <div
                                                style={{ marginBottom: '5px' }}
                                            >
                                                <strong>
                                                    [
                                                    {Math.floor(
                                                        comment.timestamp / 60,
                                                    )}
                                                    :
                                                    {Math.floor(
                                                        comment.timestamp % 60,
                                                    )
                                                        .toString()
                                                        .padStart(2, '0')}
                                                    ]
                                                </strong>
                                                {comment.scholar && (
                                                    <span
                                                        style={{
                                                            marginLeft: '10px',
                                                            fontSize: '12px',
                                                            color: '#666',
                                                        }}
                                                    >
                                                        by{' '}
                                                        {comment.scholar
                                                            .full_name ||
                                                            comment.scholar
                                                                .username}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                style={{ marginBottom: '10px' }}
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
                                                {comment.is_resolved && (
                                                    <span
                                                        style={{
                                                            marginLeft: '10px',
                                                            color: '#28a745',
                                                        }}
                                                    >
                                                        ✓ Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;
