import React from 'react';
import { Community } from '../types';

interface CommunityCardProps {
    community: Community;
    onJoin?: (communityId: number) => void;
    onLeave?: (communityId: number) => void;
    onView?: (communityId: number) => void;
    isJoined?: boolean;
    isLoading?: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
    community,
    onJoin,
    onLeave,
    onView,
    isJoined = false,
    isLoading = false,
}) => {
    return (
        <div
            style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <div style={{ marginBottom: '12px' }}>
                <h3
                    style={{
                        margin: '0 0 8px 0',
                        color: '#333',
                        fontSize: '18px',
                        fontWeight: 'bold',
                    }}
                >
                    🕌 {community.name}
                </h3>
                {community.location && (
                    <p
                        style={{
                            margin: '0 0 8px 0',
                            color: '#666',
                            fontSize: '14px',
                        }}
                    >
                        📍 {community.location}
                    </p>
                )}
            </div>

            {community.description && (
                <p
                    style={{
                        margin: '0 0 16px 0',
                        color: '#555',
                        fontSize: '14px',
                        lineHeight: '1.5',
                    }}
                >
                    {community.description}
                </p>
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#666',
                }}
            >
                <div style={{ display: 'flex', gap: '16px' }}>
                    <span>👥 {community.member_count || 0} members</span>
                    <span>🎓 {community.scholar_count || 0} scholars</span>
                </div>
                <span>
                    Created {new Date(community.created_at).toLocaleDateString()}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onView && (
                    <button
                        onClick={() => onView(community.id)}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #007bff',
                            backgroundColor: 'transparent',
                            color: '#007bff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    >
                        View Details
                    </button>
                )}

                {isJoined ? (
                    onLeave && (
                        <button
                            onClick={() => onLeave(community.id)}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #dc3545',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Leaving...' : 'Leave Community'}
                        </button>
                    )
                ) : (
                    onJoin && (
                        <button
                            onClick={() => onJoin(community.id)}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #28a745',
                                backgroundColor: '#28a745',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Joining...' : 'Join Community'}
                        </button>
                    )
                )}
            </div>

            {community.address && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666',
                    }}
                >
                    <strong>Address:</strong> {community.address}
                </div>
            )}
        </div>
    );
};

export default CommunityCard;
