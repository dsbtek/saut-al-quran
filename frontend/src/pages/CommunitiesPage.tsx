import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Community, CommunityCreate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CommunityCard from '../components/CommunityCard';
import CommunityForm from '../components/CommunityForm';

const CommunitiesPage: React.FC = () => {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

    // Mock data for demonstration
    useEffect(() => {
        // In a real app, these would be API calls
        const mockCommunities: Community[] = [
            {
                id: 1,
                name: 'Darul Hikmah Islamiyya',
                description:
                    'A community focused on Quranic studies and Tajweed improvement',
                location: 'Lagos, Nigeria',
                address: '123 Islamic Center Road, Victoria Island, Lagos',
                is_active: true,
                created_by: 1,
                created_at: '2024-01-15T10:00:00Z',
                member_count: 45,
                scholar_count: 3,
            },
            {
                id: 2,
                name: 'Masjid Al-Noor Learning Circle',
                description:
                    'Weekly Quran recitation sessions with certified scholars',
                location: 'Abuja, Nigeria',
                address: 'Central Mosque Complex, Abuja',
                is_active: true,
                created_by: 2,
                created_at: '2024-02-01T14:30:00Z',
                member_count: 28,
                scholar_count: 2,
            },
            {
                id: 3,
                name: 'Youth Quran Academy',
                description:
                    'Dedicated to teaching young Muslims proper Quran recitation',
                location: 'Kano, Nigeria',
                address: 'Youth Islamic Center, Kano',
                is_active: true,
                created_by: 3,
                created_at: '2024-01-20T09:15:00Z',
                member_count: 67,
                scholar_count: 4,
            },
        ];

        setCommunities(mockCommunities);

        // Mock user's communities
        if (user) {
            setMyCommunities(mockCommunities.slice(0, 1)); // User is member of first community
        }
    }, [user]);

    const handleCreateCommunity = async (communityData: CommunityCreate) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const newCommunity: Community = {
                id: Date.now(),
                ...communityData,
                is_active: true,
                created_by: user?.id || 0,
                created_at: new Date().toISOString(),
                member_count: 1,
                scholar_count:
                    user?.role === 'scholar' || user?.role === 'admin' ? 1 : 0,
            };

            setCommunities((prev) => [newCommunity, ...prev]);
            setMyCommunities((prev) => [newCommunity, ...prev]);
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating community:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinCommunity = async (communityId: number) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            const community = communities.find((c) => c.id === communityId);
            if (community) {
                setMyCommunities((prev) => [...prev, community]);
                setCommunities((prev) =>
                    prev.map((c) =>
                        c.id === communityId
                            ? { ...c, member_count: (c.member_count || 0) + 1 }
                            : c,
                    ),
                );
            }
        } catch (error) {
            console.error('Error joining community:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveCommunity = async (communityId: number) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            setMyCommunities((prev) =>
                prev.filter((c) => c.id !== communityId),
            );
            setCommunities((prev) =>
                prev.map((c) =>
                    c.id === communityId
                        ? {
                              ...c,
                              member_count: Math.max(
                                  (c.member_count || 1) - 1,
                                  0,
                              ),
                          }
                        : c,
                ),
            );
        } catch (error) {
            console.error('Error leaving community:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCommunities = communities.filter(
        (community) =>
            community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            community.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            community.location
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const isUserMember = (communityId: number) => {
        return myCommunities.some((c) => c.id === communityId);
    };

    const canCreateCommunity =
        user?.role === 'admin' || user?.role === 'scholar';

    if (showCreateForm) {
        return (
            <div
                style={{
                    padding: '20px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}
            >
                <CommunityForm
                    onSubmit={handleCreateCommunity}
                    onCancel={() => setShowCreateForm(false)}
                    isLoading={isLoading}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#f8f9fa',
                        color: '#007bff',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        border: '1px solid #007bff',
                    }}
                >
                    ← Back to Home
                </Link>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#333', marginBottom: '8px' }}>
                    🕌 Islamic Communities (Islamiyya)
                </h1>
                <p style={{ color: '#666', fontSize: '16px' }}>
                    Join or create communities to learn and improve your Quran
                    recitation together
                </p>
            </div>

            {/* Action Buttons */}
            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    justifyContent: 'center',
                }}
            >
                {canCreateCommunity && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                        }}
                    >
                        ➕ Create Community
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    marginBottom: '24px',
                    borderBottom: '1px solid #ddd',
                }}
            >
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: activeTab === 'all' ? '#007bff' : '#666',
                        borderBottom:
                            activeTab === 'all' ? '2px solid #007bff' : 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: activeTab === 'all' ? 'bold' : 'normal',
                    }}
                >
                    All Communities ({filteredCommunities.length})
                </button>
                {user && (
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: activeTab === 'my' ? '#007bff' : '#666',
                            borderBottom:
                                activeTab === 'my'
                                    ? '2px solid #007bff'
                                    : 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'my' ? 'bold' : 'normal',
                        }}
                    >
                        My Communities ({myCommunities.length})
                    </button>
                )}
            </div>

            {/* Search */}
            {activeTab === 'all' && (
                <div style={{ marginBottom: '24px' }}>
                    <input
                        type="text"
                        placeholder="Search communities by name, description, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            margin: '0 auto',
                            display: 'block',
                        }}
                    />
                </div>
            )}

            {/* Communities List */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {activeTab === 'all' ? (
                    filteredCommunities.length > 0 ? (
                        filteredCommunities.map((community) => (
                            <CommunityCard
                                key={community.id}
                                community={community}
                                onJoin={user ? handleJoinCommunity : undefined}
                                onLeave={
                                    user ? handleLeaveCommunity : undefined
                                }
                                isJoined={isUserMember(community.id)}
                                isLoading={isLoading}
                            />
                        ))
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#666',
                            }}
                        >
                            {searchTerm ? (
                                <>
                                    <p>
                                        No communities found matching "
                                        {searchTerm}"
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            marginTop: '12px',
                                            padding: '8px 16px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Clear Search
                                    </button>
                                </>
                            ) : (
                                <p>No communities available yet.</p>
                            )}
                        </div>
                    )
                ) : myCommunities.length > 0 ? (
                    myCommunities.map((community) => (
                        <CommunityCard
                            key={community.id}
                            community={community}
                            onLeave={handleLeaveCommunity}
                            isJoined={true}
                            isLoading={isLoading}
                        />
                    ))
                ) : (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#666',
                        }}
                    >
                        <p>You haven't joined any communities yet.</p>
                        <button
                            onClick={() => setActiveTab('all')}
                            style={{
                                marginTop: '12px',
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Browse Communities
                        </button>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div
                style={{
                    marginTop: '40px',
                    padding: '24px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    maxWidth: '800px',
                    margin: '40px auto 0',
                }}
            >
                <h3 style={{ marginBottom: '16px', color: '#333' }}>
                    🌟 Benefits of Joining a Community
                </h3>
                <ul style={{ color: '#555', lineHeight: '1.6' }}>
                    <li>
                        Get feedback from dedicated scholars in your community
                    </li>
                    <li>Connect with fellow learners and share experiences</li>
                    <li>Participate in group learning sessions and events</li>
                    <li>Track your progress within a supportive environment</li>
                    <li>Access to community-specific resources and guidance</li>
                </ul>
            </div>
        </div>
    );
};

export default CommunitiesPage;
