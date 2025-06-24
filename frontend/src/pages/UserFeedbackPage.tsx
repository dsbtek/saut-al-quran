import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserFeedbackCreate } from '../types';
import FeedbackForm from '../components/FeedbackForm';

const UserFeedbackPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleFeedbackSubmit = async (feedbackData: UserFeedbackCreate) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Feedback submitted:', feedbackData);
            setShowSuccessMessage(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuccessMessage) {
        return (
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
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

                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#d4edda',
                        borderRadius: '12px',
                        border: '1px solid #c3e6cb',
                    }}
                >
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                    <h2 style={{ color: '#155724', marginBottom: '16px' }}>
                        Thank You for Your Feedback!
                    </h2>
                    <p style={{ color: '#155724', fontSize: '16px', marginBottom: '24px' }}>
                        Your feedback has been successfully submitted. We appreciate you taking 
                        the time to help us improve Saut Al-Qur'an.
                    </p>
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                        }}
                    >
                        <h3 style={{ color: '#333', marginBottom: '12px' }}>What happens next?</h3>
                        <ul style={{ textAlign: 'left', color: '#666', lineHeight: '1.6' }}>
                            <li>Our team will review your feedback within 2-3 business days</li>
                            <li>If you provided contact information, we may reach out for clarification</li>
                            <li>Bug reports will be prioritized based on severity and impact</li>
                            <li>Feature requests will be considered for future releases</li>
                            <li>You can track updates on our development progress</li>
                        </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowSuccessMessage(false)}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            Submit More Feedback
                        </button>
                        <Link
                            to="/"
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                            }}
                        >
                            Return to App
                        </Link>
                    </div>
                </div>
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
                    📝 Feedback & Support
                </h1>
                <p style={{ color: '#666', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    Help us improve Saut Al-Qur'an by sharing your thoughts, reporting bugs, 
                    or suggesting new features.
                </p>
            </div>

            {/* Feedback Categories Info */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px',
                    marginBottom: '40px',
                }}
            >
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#fff5f5',
                        border: '1px solid #fed7d7',
                        borderRadius: '12px',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🐛</div>
                    <h3 style={{ color: '#c53030', marginBottom: '8px' }}>Bug Reports</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Found something that's not working correctly? Let us know! 
                        Include details about what you were doing when the issue occurred.
                    </p>
                </div>
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#f0fff4',
                        border: '1px solid #c6f6d5',
                        borderRadius: '12px',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💡</div>
                    <h3 style={{ color: '#2f855a', marginBottom: '8px' }}>Feature Requests</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Have an idea for a new feature? We'd love to hear it! 
                        Describe how it would help you and other users.
                    </p>
                </div>
                <div
                    style={{
                        padding: '24px',
                        backgroundColor: '#f7fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                    <h3 style={{ color: '#4a5568', marginBottom: '8px' }}>General Feedback</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Share your overall experience, suggestions for improvement, 
                        or just let us know what you think about the app.
                    </p>
                </div>
            </div>

            {/* Feedback Form */}
            <FeedbackForm
                onSubmit={handleFeedbackSubmit}
                isLoading={isLoading}
            />

            {/* Additional Support Info */}
            <div
                style={{
                    marginTop: '40px',
                    padding: '24px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '12px',
                }}
            >
                <h3 style={{ color: '#007bff', marginBottom: '16px', textAlign: 'center' }}>
                    🤝 Other Ways to Get Support
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                        <h4 style={{ color: '#333', marginBottom: '4px' }}>Email Support</h4>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            support@saut-al-quran.com
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
                        <h4 style={{ color: '#333', marginBottom: '4px' }}>Community</h4>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Join our community discussions
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
                        <h4 style={{ color: '#333', marginBottom: '4px' }}>Documentation</h4>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Check our help guides and FAQs
                        </p>
                    </div>
                </div>
            </div>

            {/* Response Time Info */}
            <div
                style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    textAlign: 'center',
                }}
            >
                <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
                    <strong>Response Time:</strong> We typically respond to feedback within 2-3 business days. 
                    Critical bugs are prioritized and addressed as soon as possible.
                </p>
            </div>
        </div>
    );
};

export default UserFeedbackPage;
