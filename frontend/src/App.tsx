import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import HomePage from './pages/HomePage';
import RecordingPage from './pages/RecordingPage';
import FeedbackPage from './pages/FeedbackPage';
import ScholarDashboard from './pages/ScholarDashboard';
import ScholarReviewPage from './pages/ScholarReviewPage';
import CommunitiesPage from './pages/CommunitiesPage';
import DonationsPage from './pages/DonationsPage';
import UserFeedbackPage from './pages/UserFeedbackPage';

const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-sand-50">
                <div className="text-center">
                    <div className="text-3xl mb-2">🕌</div>
                    <div className="text-sm font-medium text-stone-600">Loading Saut Al-Qur&apos;an...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-sand-50">
                <header className="bg-emerald-950 py-8 text-center text-white shadow-sm">
                    <div className="text-3xl mb-1">🕌</div>
                    <h1 className="text-2xl font-bold tracking-tight">Saut Al-Qur&apos;an</h1>
                    <p className="font-arabic text-lg text-emerald-200 mt-0.5">صوت القرآن</p>
                    <p className="mt-2 text-sm text-emerald-100/80">
                        Perfect your Qur&apos;an recitation with guidance from certified scholars
                    </p>
                </header>
                <main className="px-4 py-8">
                    <AuthForm />
                </main>
            </div>
        );
    }

    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/record" element={<RecordingPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/scholar" element={<ScholarDashboard />} />
                    <Route path="/scholar/review/:recitationId" element={<ScholarReviewPage />} />
                    <Route path="/communities" element={<CommunitiesPage />} />
                    <Route path="/donations" element={<DonationsPage />} />
                    <Route path="/user-feedback" element={<UserFeedbackPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
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
