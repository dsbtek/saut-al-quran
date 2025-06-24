import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className="page-container">
            <h2>Welcome to Saut Al-Qur'an</h2>
            <p>
                Perfect your Qur'an recitation with guidance from certified
                scholars.
            </p>

            <div className="navigation">
                <Link to="/record" className="nav-btn">
                    🎤 Start Recording
                </Link>
                <Link to="/feedback" className="nav-btn">
                    💬 View Feedback
                </Link>
                <Link to="/communities" className="nav-btn">
                    🕌 Communities
                </Link>
                <Link to="/scholar" className="nav-btn">
                    👨‍🏫 Scholar Dashboard
                </Link>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginTop: '30px',
                }}
            >
                <Link
                    to="/donations"
                    style={{
                        display: 'block',
                        padding: '20px',
                        backgroundColor: '#e8f5e8',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#155724',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        💝
                    </div>
                    <h3 style={{ margin: '0 0 8px 0' }}>Support Us</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        Help maintain and improve the app
                    </p>
                </Link>

                <Link
                    to="/user-feedback"
                    style={{
                        display: 'block',
                        padding: '20px',
                        backgroundColor: '#e7f3ff',
                        border: '1px solid #b3d7ff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#0066cc',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        📝
                    </div>
                    <h3 style={{ margin: '0 0 8px 0' }}>Send Feedback</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        Report bugs or suggest features
                    </p>
                </Link>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'left' }}>
                <h3>Features:</h3>
                <ul>
                    <li>
                        🎙️ Record your Qur'an recitation with real-time audio
                        visualization
                    </li>
                    <li>🔁 Practice with repeat loops</li>
                    <li>🔖 Add timestamped markers</li>
                    <li>💬 Receive feedback from certified scholars</li>
                    <li>
                        🕌 Join Islamic communities (Islamiyya) for group
                        learning
                    </li>
                    <li>👥 Connect with scholars and fellow learners</li>
                    <li>📈 Track your progress within your community</li>
                    <li>💝 Support the app through donations</li>
                    <li>📝 Provide feedback to help us improve</li>
                    <li>📱 Works offline (PWA)</li>
                </ul>
            </div>
        </div>
    );
};

export default HomePage;
