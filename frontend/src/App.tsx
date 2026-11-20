import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import { IslamicPattern, getHijriDateString } from './components/IslamicPattern';
import { QuranicVerseBanner, WelcomePillars } from './components/WelcomeShowcase';
import HomePage from './pages/HomePage';
import RecordingPage from './pages/RecordingPage';
import FeedbackPage from './pages/FeedbackPage';
import ScholarDashboard from './pages/ScholarDashboard';
import ScholarReviewPage from './pages/ScholarReviewPage';
import CommunitiesPage from './pages/CommunitiesPage';
import IslamiyyaDetailPage from './pages/IslamiyyaDetailPage';
import LectureRoomPage from './pages/LectureRoomPage';
import AdminDashboard from './pages/AdminDashboard';
import DonationsPage from './pages/DonationsPage';
import UserFeedbackPage from './pages/UserFeedbackPage';

const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const hijriDate = getHijriDateString();

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
                <div className="bg-emerald-950/95 border-b border-emerald-900 text-emerald-200/90 text-xs">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
                        <span className="font-arabic text-sm text-amber-300">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </span>
                        {hijriDate && <span>{hijriDate}</span>}
                    </div>
                </div>

                <header className="relative overflow-hidden bg-emerald-950 py-10 px-4 text-white shadow-sm">
                    <IslamicPattern className="absolute inset-0 text-amber-200" />
                    <div className="relative mx-auto max-w-6xl text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900/90 text-3xl border border-amber-400/40 shadow-inner">
                            🕌
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Saut Al-Qur&apos;an
                        </h1>
                        <p className="font-arabic text-2xl text-amber-300 mt-1">صوت القرآن</p>
                        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-emerald-100/90">
                            A serene Islamic learning sanctuary connecting students, certified scholars,
                            and Islamiyya centers for Qur&apos;an recitation, structured classes, and live lectures.
                        </p>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                    <QuranicVerseBanner />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-7 space-y-5">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">
                                    Welcome to Your Qur&apos;anic Journey
                                </h2>
                                <p className="mt-1 text-sm text-stone-600">
                                    Designed for learners of all ages — children, adult brothers, and adult sisters —
                                    with offline-friendly recording and direct scholar mentorship.
                                </p>
                            </div>
                            <WelcomePillars />
                        </div>

                        <div className="lg:col-span-5">
                            <AuthForm />
                        </div>
                    </div>
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
                    <Route path="/communities/:communityId" element={<IslamiyyaDetailPage />} />
                    <Route path="/lectures/:lectureId" element={<LectureRoomPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
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
