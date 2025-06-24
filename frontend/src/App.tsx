import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import RecordingPage from './pages/RecordingPage';
import FeedbackPage from './pages/FeedbackPage';
import ScholarDashboard from './pages/ScholarDashboard';
import ScholarReviewPage from './pages/ScholarReviewPage';
import CommunitiesPage from './pages/CommunitiesPage';
import DonationsPage from './pages/DonationsPage';
import UserFeedbackPage from './pages/UserFeedbackPage';
import AuthForm from './components/AuthForm';
import OfflineIndicator from './components/OfflineIndicator';

const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();

    if (isLoading) {
        return (
            <div className="App">
                <div style={{ padding: '50px', textAlign: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>🕌 Saut Al-Qur'an</h1>
                    <p>صوت القرآن</p>
                </header>
                <main>
                    <AuthForm />
                </main>
            </div>
        );
    }

    return (
        <Router>
            <div className="App">
                <OfflineIndicator />
                <header className="App-header">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <div>
                            <h1>🕌 Saut Al-Qur'an</h1>
                            <p>صوت القرآن</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p
                                style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '14px',
                                }}
                            >
                                Welcome, {user?.full_name || user?.username}
                            </p>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: 'white',
                                    padding: '5px 15px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/record" element={<RecordingPage />} />
                        <Route path="/feedback" element={<FeedbackPage />} />
                        <Route path="/scholar" element={<ScholarDashboard />} />
                        <Route
                            path="/scholar/review/:recitationId"
                            element={<ScholarReviewPage />}
                        />
                        <Route
                            path="/communities"
                            element={<CommunitiesPage />}
                        />
                        <Route path="/donations" element={<DonationsPage />} />
                        <Route
                            path="/user-feedback"
                            element={<UserFeedbackPage />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
