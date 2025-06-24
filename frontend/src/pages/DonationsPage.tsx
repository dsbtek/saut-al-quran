import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Donation, DonationCreate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import DonationForm from '../components/DonationForm';

const DonationsPage: React.FC = () => {
    const { user } = useAuth();
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
    const [donationStats, setDonationStats] = useState({
        total_donations: 0,
        total_donors: 0,
        monthly_donations: 0,
        recent_donations: 0,
    });

    // Mock data for demonstration
    useEffect(() => {
        const mockDonations: Donation[] = [
            {
                id: 1,
                amount: 5000,
                currency: 'NGN',
                donation_type: 'one_time',
                status: 'completed',
                payment_provider: 'paystack',
                transaction_id: 'SAQ_123456',
                donor_name: 'Ahmad Ibrahim',
                message: 'May Allah bless this project',
                is_anonymous: false,
                created_at: '2024-06-20T10:00:00Z',
                completed_at: '2024-06-20T10:05:00Z',
            },
            {
                id: 2,
                amount: 2500,
                currency: 'NGN',
                donation_type: 'one_time',
                status: 'completed',
                payment_provider: 'paystack',
                transaction_id: 'SAQ_789012',
                donor_name: 'Anonymous',
                message: 'Keep up the good work!',
                is_anonymous: true,
                created_at: '2024-06-19T15:30:00Z',
                completed_at: '2024-06-19T15:35:00Z',
            },
            {
                id: 3,
                amount: 10000,
                currency: 'NGN',
                donation_type: 'one_time',
                status: 'completed',
                payment_provider: 'paystack',
                transaction_id: 'SAQ_345678',
                donor_name: 'Fatima Abdullahi',
                message: 'For the sake of Allah',
                is_anonymous: false,
                created_at: '2024-06-18T09:15:00Z',
                completed_at: '2024-06-18T09:20:00Z',
            },
        ];

        setRecentDonations(mockDonations);
        setDonationStats({
            total_donations: 125000,
            total_donors: 45,
            monthly_donations: 35000,
            recent_donations: 12,
        });
    }, []);

    const handleDonation = async (donationData: DonationCreate) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In a real app, this would redirect to payment gateway
            alert('Redirecting to payment gateway...\n\nThis is a demo - payment integration would be implemented with Paystack/Stripe.');
            setShowDonationForm(false);
        } catch (error) {
            console.error('Error processing donation:', error);
            alert('Error processing donation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (showDonationForm) {
        return (
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <DonationForm
                    onSubmit={handleDonation}
                    onCancel={() => setShowDonationForm(false)}
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

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: '#333', marginBottom: '8px' }}>
                    💝 Support Saut Al-Qur'an
                </h1>
                <p style={{ color: '#666', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    Help us maintain and improve this platform for the Muslim community worldwide. 
                    Your donations support development, hosting, and new features.
                </p>
            </div>

            {/* Donation Stats */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px',
                }}
            >
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#e7f3ff',
                        borderRadius: '12px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
                        {formatCurrency(donationStats.total_donations)}
                    </div>
                    <div style={{ color: '#666', marginTop: '8px' }}>Total Raised</div>
                </div>
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '12px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                        {donationStats.total_donors}
                    </div>
                    <div style={{ color: '#666', marginTop: '8px' }}>Generous Donors</div>
                </div>
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '12px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                        {formatCurrency(donationStats.monthly_donations)}
                    </div>
                    <div style={{ color: '#666', marginTop: '8px' }}>This Month</div>
                </div>
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#f8d7da',
                        borderRadius: '12px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
                        {donationStats.recent_donations}
                    </div>
                    <div style={{ color: '#666', marginTop: '8px' }}>Recent Donations</div>
                </div>
            </div>

            {/* Donate Button */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <button
                    onClick={() => setShowDonationForm(true)}
                    style={{
                        padding: '16px 32px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 8px rgba(40, 167, 69, 0.3)',
                    }}
                >
                    💝 Make a Donation
                </button>
            </div>

            {/* How Donations Help */}
            <div
                style={{
                    backgroundColor: '#f8f9fa',
                    padding: '32px',
                    borderRadius: '12px',
                    marginBottom: '40px',
                }}
            >
                <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
                    🎯 How Your Donations Help
                </h2>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🖥️</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>Server & Hosting</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Keep the app running 24/7 with reliable hosting and fast servers
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>New Features</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Develop new features like advanced audio analysis and AI feedback
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛠️</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>Maintenance</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Regular updates, bug fixes, and security improvements
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌍</div>
                        <h3 style={{ color: '#333', marginBottom: '8px' }}>Global Access</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Make the app accessible to Muslims worldwide, regardless of location
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Donations */}
            <div>
                <h2 style={{ marginBottom: '24px', color: '#333' }}>
                    🙏 Recent Donations
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recentDonations.map((donation) => (
                        <div
                            key={donation.id}
                            style={{
                                padding: '20px',
                                backgroundColor: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                    {donation.is_anonymous ? 'Anonymous Donor' : donation.donor_name}
                                </div>
                                {donation.message && (
                                    <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                                        "{donation.message}"
                                    </div>
                                )}
                                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                    {formatDate(donation.created_at)}
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#28a745',
                                }}
                            >
                                {formatCurrency(donation.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Message */}
            <div
                style={{
                    marginTop: '40px',
                    padding: '24px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '8px',
                    textAlign: 'center',
                }}
            >
                <h3 style={{ color: '#007bff', marginBottom: '12px' }}>
                    جَزَاكَ اللَّهُ خَيْرًا
                </h3>
                <p style={{ color: '#666', fontSize: '16px' }}>
                    May Allah reward you with goodness for your support. Every donation, 
                    no matter the size, helps us serve the Muslim community better.
                </p>
            </div>
        </div>
    );
};

export default DonationsPage;
