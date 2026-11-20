import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ClassCategory,
    IslamicSubject,
    Community,
    CommunityMembership,
    IslamiyyaClass,
    LectureStreamTarget,
    PublicLecture,
} from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { IslamicPattern } from '../components/IslamicPattern';
import ClassBooksPanel from '../components/ClassBooksPanel';

const CATEGORY_LABELS: Record<string, string> = {
    all: 'All Categories',
    children: 'Children',
    adult_male: 'Adult Male',
    adult_women: 'Adult Women',
    youth: 'Youth',
    general: 'General',
};

const SUBJECT_LABELS: Record<string, string> = {
    quran_tajweed: "Qur'an & Tajweed",
    fiqh: 'Fiqh',
    aqidah: 'Aqidah',
    hadith: 'Hadith',
    seerah: 'Seerah',
    tafsir: 'Tafsir',
    arabic: 'Arabic',
    akhlaq: 'Akhlaq',
    general: 'General Islamic Studies',
};

const IslamiyyaDetailPage: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const id = parseInt(communityId || '0', 10);
    const { user } = useAuth();

    const [community, setCommunity] = useState<Community | null>(null);
    const [classes, setClasses] = useState<IslamiyyaClass[]>([]);
    const [lectures, setLectures] = useState<PublicLecture[]>([]);
    const [requests, setRequests] = useState<CommunityMembership[]>([]);
    const [activeTab, setActiveTab] = useState<'classes' | 'lectures' | 'requests' | 'members'>('classes');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');

    // Create class form
    const [showClassForm, setShowClassForm] = useState(false);
    const [classForm, setClassForm] = useState({
        title: '',
        description: '',
        subject: 'quran_tajweed' as IslamicSubject,
        category: 'children' as ClassCategory,
        schedule_days: 'Sat, Sun',
        start_time: '09:00',
        end_time: '10:30',
        surah_focus: '',
    });

    // Schedule lecture form
    const [showLectureForm, setShowLectureForm] = useState(false);
    const [lectureForm, setLectureForm] = useState({
        title: '',
        speaker_name: user?.full_name || user?.username || '',
        topic: 'Tajweed',
        description: '',
        scheduled_at: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
        stream_embed_url: '',
        facebook_url: '',
        youtube_url: '',
        instagram_url: '',
    });

    const isGlobalManagerOrAdmin = user?.role === 'admin' || user?.role === 'islamiyya_manager';
    const myMembership = community?.memberships?.find((m) => m.user_id === user?.id);
    const canManageClasses =
        isGlobalManagerOrAdmin ||
        myMembership?.role === 'admin' ||
        myMembership?.role === 'scholar';

    useEffect(() => {
        if (id) loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadAll = async () => {
        try {
            setIsLoading(true);
            setError('');
            const [comm, clsList, lecList] = await Promise.all([
                apiService.getCommunity(id),
                apiService.getCommunityClasses(id),
                apiService.getCommunityLectures(id),
            ]);
            setCommunity(comm);
            setClasses(clsList);
            setLectures(lecList);

            // Attempt to load join requests if manager/scholar
            try {
                const reqs = await apiService.getCommunityRequests(id);
                setRequests(reqs);
            } catch {
                setRequests([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load Islamiyya details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.createClass({
                community_id: id,
                ...classForm,
            });
            setShowClassForm(false);
            setClassForm({
                title: '',
                description: '',
                subject: 'quran_tajweed',
                category: 'children',
                schedule_days: 'Sat, Sun',
                start_time: '09:00',
                end_time: '10:30',
                surah_focus: '',
            });
            setBanner('Class scheduled successfully!');
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create class');
        }
    };

    const handleEnroll = async (classId: number) => {
        try {
            await apiService.requestClassEnrollment(classId);
            setBanner('Class enrollment request submitted!');
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to request enrollment');
        }
    };

    const handleDecideEnrollment = async (classId: number, enrollmentId: number, decision: 'approve' | 'reject') => {
        try {
            await apiService.decideClassEnrollment(classId, enrollmentId, decision);
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update enrollment');
        }
    };

    const handleDecideJoinRequest = async (membershipId: number, decision: 'approve' | 'reject') => {
        try {
            await apiService.decideCommunityRequest(id, membershipId, decision);
            setBanner(`Request ${decision}d.`);
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process join request');
        }
    };

    const handleCreateLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        const stream_targets: LectureStreamTarget[] = [];
        if (lectureForm.facebook_url.trim()) {
            stream_targets.push({ platform: 'facebook', watch_url: lectureForm.facebook_url.trim() });
        }
        if (lectureForm.youtube_url.trim()) {
            stream_targets.push({ platform: 'youtube', watch_url: lectureForm.youtube_url.trim() });
        }
        if (lectureForm.instagram_url.trim()) {
            stream_targets.push({ platform: 'instagram', watch_url: lectureForm.instagram_url.trim() });
        }

        try {
            await apiService.createLecture({
                community_id: id,
                title: lectureForm.title,
                speaker_name: lectureForm.speaker_name,
                topic: lectureForm.topic,
                description: lectureForm.description,
                scheduled_at: new Date(lectureForm.scheduled_at).toISOString(),
                stream_embed_url: lectureForm.stream_embed_url.trim() || undefined,
                is_public: true,
                stream_targets,
            });
            setShowLectureForm(false);
            setBanner('Public lecture scheduled!');
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to schedule lecture');
        }
    };

    const handleLectureStatus = async (lectureId: number, status: 'live' | 'ended') => {
        try {
            await apiService.updateLectureStatus(lectureId, status);
            await loadAll();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update lecture status');
        }
    };

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-stone-500">Loading Islamiyya hub...</div>;
    }

    if (!community) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                <p className="text-stone-600 mb-3">Islamiyya not found.</p>
                <Link to="/communities" className="text-sm font-semibold text-emerald-800 hover:underline">
                    ← Back to Islamiyyas
                </Link>
            </div>
        );
    }

    const filteredClasses =
        categoryFilter === 'all' ? classes : classes.filter((c) => c.category === categoryFilter);

    return (
        <div className="space-y-6">
            <Link
                to="/communities"
                className="inline-block rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
                ← All Islamiyyas
            </Link>

            {/* Islamiyya Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-6 text-white shadow-sm">
                <IslamicPattern className="absolute inset-0 text-amber-200" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                            Islamiyya Learning Center
                        </span>
                        <h1 className="mt-1 text-2xl font-bold">{community.name}</h1>
                        {community.description && (
                            <p className="mt-2 max-w-2xl text-sm text-emerald-100/85">
                                {community.description}
                            </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-emerald-200">
                            {community.location && <span>📍 {community.location}</span>}
                            <span>👥 {community.member_count || 0} Approved Members</span>
                            <span>👨‍🏫 {community.scholar_count || 0} Scholars</span>
                        </div>
                    </div>
                </div>
            </div>

            {banner && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {banner}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
                {([
                    { id: 'classes' as const, label: `Classes (${classes.length})` },
                    { id: 'lectures' as const, label: `Public Lectures (${lectures.length})` },
                    ...(canManageClasses
                        ? [{ id: 'requests' as const, label: `Join Requests (${requests.length})` }]
                        : []),
                    { id: 'members' as const, label: `Members (${community.member_count || 0})` },
                ]).map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                            activeTab === t.id
                                ? 'bg-emerald-800 text-white'
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* CLASSES TAB */}
            {activeTab === 'classes' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCategoryFilter(key)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                                        categoryFilter === key
                                            ? 'bg-amber-500 text-stone-950 border-amber-500'
                                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {canManageClasses && (
                            <button
                                type="button"
                                onClick={() => setShowClassForm(!showClassForm)}
                                className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                            >
                                {showClassForm ? 'Cancel' : '+ Create Class'}
                            </button>
                        )}
                    </div>

                    {showClassForm && (
                        <form
                            onSubmit={handleCreateClass}
                            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                        >
                            <h3 className="text-base font-bold text-stone-900">Create &amp; Schedule Class</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="Class title"
                                    value={classForm.title}
                                    onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <select
                                    value={classForm.subject}
                                    onChange={(e) =>
                                        setClassForm({ ...classForm, subject: e.target.value as IslamicSubject })
                                    }
                                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                                >
                                    {Object.entries(SUBJECT_LABELS).map(([k, label]) => (
                                        <option key={k} value={k}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={classForm.category}
                                    onChange={(e) =>
                                        setClassForm({ ...classForm, category: e.target.value as ClassCategory })
                                    }
                                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="children">Children</option>
                                    <option value="adult_male">Adult Male</option>
                                    <option value="adult_women">Adult Women</option>
                                    <option value="youth">Youth</option>
                                    <option value="general">General</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Days (e.g. Sat, Sun)"
                                    value={classForm.schedule_days}
                                    onChange={(e) => setClassForm({ ...classForm, schedule_days: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Surah / Juz focus"
                                    value={classForm.surah_focus}
                                    onChange={(e) => setClassForm({ ...classForm, surah_focus: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="time"
                                    value={classForm.start_time}
                                    onChange={(e) => setClassForm({ ...classForm, start_time: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="time"
                                    value={classForm.end_time}
                                    onChange={(e) => setClassForm({ ...classForm, end_time: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Class description"
                                value={classForm.description}
                                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                            >
                                Save Class
                            </button>
                        </form>
                    )}

                    {filteredClasses.length === 0 ? (
                        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                            No classes in this category yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredClasses.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                                                    {CATEGORY_LABELS[cls.category] || cls.category}
                                                </span>
                                                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                                                    {SUBJECT_LABELS[cls.subject] || cls.subject}
                                                </span>
                                            </div>
                                            <h3 className="mt-2 text-base font-bold text-stone-900">{cls.title}</h3>
                                        </div>
                                        <span className="text-xs text-stone-500">
                                            {cls.enrolled_count} enrolled
                                        </span>
                                    </div>
                                    {cls.description && (
                                        <p className="text-sm text-stone-600">{cls.description}</p>
                                    )}
                                    <div className="text-xs text-stone-500 space-y-0.5">
                                        {cls.schedule_days && (
                                            <div>
                                                🗓 {cls.schedule_days} • {cls.start_time}–{cls.end_time}
                                            </div>
                                        )}
                                        {cls.surah_focus && <div>📖 Focus: {cls.surah_focus}</div>}
                                        {cls.scholar && (
                                            <div>👨‍🏫 Teacher: {cls.scholar.full_name || cls.scholar.username}</div>
                                        )}
                                    </div>

                                    <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                                        {cls.my_enrollment_status ? (
                                            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold capitalize text-stone-800">
                                                Enrollment: {cls.my_enrollment_status}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleEnroll(cls.id)}
                                                className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                                            >
                                                Request Enrollment
                                            </button>
                                        )}
                                    </div>

                                    <ClassBooksPanel classId={cls.id} canManage={canManageClasses} />

                                    {/* Pending student enrollments for scholar/manager */}
                                    {canManageClasses &&
                                        cls.enrollments &&
                                        cls.enrollments.filter((e) => e.status === 'pending').length > 0 && (
                                            <div className="mt-2 rounded-xl bg-amber-50/70 p-3 border border-amber-200 space-y-2">
                                                <div className="text-xs font-semibold text-amber-950">
                                                    Pending Student Enrollments
                                                </div>
                                                {cls.enrollments
                                                    .filter((e) => e.status === 'pending')
                                                    .map((enr) => (
                                                        <div
                                                            key={enr.id}
                                                            className="flex items-center justify-between text-xs"
                                                        >
                                                            <span className="font-medium text-stone-800">
                                                                {enr.student?.full_name || enr.student?.username}
                                                            </span>
                                                            <div className="flex gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDecideEnrollment(cls.id, enr.id, 'approve')
                                                                    }
                                                                    className="rounded bg-emerald-800 px-2.5 py-1 text-white font-semibold"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDecideEnrollment(cls.id, enr.id, 'reject')
                                                                    }
                                                                    className="rounded bg-red-600 px-2.5 py-1 text-white font-semibold"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PUBLIC LECTURES TAB */}
            {activeTab === 'lectures' && (
                <div className="space-y-4">
                    {canManageClasses && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowLectureForm(!showLectureForm)}
                                className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                            >
                                {showLectureForm ? 'Cancel' : '+ Schedule Public Lecture'}
                            </button>
                        </div>
                    )}

                    {showLectureForm && (
                        <form
                            onSubmit={handleCreateLecture}
                            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                        >
                            <h3 className="text-base font-bold text-stone-900">
                                Schedule Public Lecture &amp; Social Streams
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="Lecture title"
                                    value={lectureForm.title}
                                    onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="Speaker name"
                                    value={lectureForm.speaker_name}
                                    onChange={(e) => setLectureForm({ ...lectureForm, speaker_name: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="datetime-local"
                                    required
                                    value={lectureForm.scheduled_at}
                                    onChange={(e) => setLectureForm({ ...lectureForm, scheduled_at: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="url"
                                    placeholder="Embed Player URL (YouTube/Facebook embed)"
                                    value={lectureForm.stream_embed_url}
                                    onChange={(e) =>
                                        setLectureForm({ ...lectureForm, stream_embed_url: e.target.value })
                                    }
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="url"
                                    placeholder="Facebook Live Watch URL"
                                    value={lectureForm.facebook_url}
                                    onChange={(e) => setLectureForm({ ...lectureForm, facebook_url: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                                <input
                                    type="url"
                                    placeholder="YouTube Live Watch URL"
                                    value={lectureForm.youtube_url}
                                    onChange={(e) => setLectureForm({ ...lectureForm, youtube_url: e.target.value })}
                                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Lecture description"
                                value={lectureForm.description}
                                onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                            >
                                Publish Lecture
                            </button>
                        </form>
                    )}

                    {lectures.length === 0 ? (
                        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
                            No public lectures scheduled yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lectures.map((lec) => (
                                <div
                                    key={lec.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                                                    lec.status === 'live'
                                                        ? 'bg-red-100 text-red-700'
                                                        : lec.status === 'ended'
                                                        ? 'bg-stone-100 text-stone-600'
                                                        : 'bg-amber-100 text-amber-900'
                                                }`}
                                            >
                                                {lec.status}
                                            </span>
                                            <h3 className="text-base font-bold text-stone-900">{lec.title}</h3>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-600">
                                            Speaker: {lec.speaker_name} • {new Date(lec.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {canManageClasses && lec.status === 'scheduled' && (
                                            <button
                                                type="button"
                                                onClick={() => handleLectureStatus(lec.id, 'live')}
                                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                                            >
                                                Go Live
                                            </button>
                                        )}
                                        {canManageClasses && lec.status === 'live' && (
                                            <button
                                                type="button"
                                                onClick={() => handleLectureStatus(lec.id, 'ended')}
                                                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
                                            >
                                                End Stream
                                            </button>
                                        )}
                                        <Link
                                            to={`/lectures/${lec.id}`}
                                            className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                                        >
                                            Open Lecture Room →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* JOIN REQUESTS TAB */}
            {activeTab === 'requests' && canManageClasses && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-stone-900">
                        Pending Join Requests (Scholars &amp; Students)
                    </h3>
                    {requests.length === 0 ? (
                        <p className="text-sm text-stone-500">No pending join requests.</p>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-stone-900">
                                                {req.user?.full_name || req.user?.username}
                                            </span>
                                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-amber-900">
                                                Requested: {req.requested_role === 'scholar' ? 'Scholar' : 'Student'}
                                            </span>
                                        </div>
                                        {req.request_message && (
                                            <p className="mt-1 text-xs text-stone-600">{req.request_message}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDecideJoinRequest(req.id, 'approve')}
                                            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecideJoinRequest(req.id, 'reject')}
                                            className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-base font-bold text-stone-900">Approved Members</h3>
                    {!community.memberships || community.memberships.length === 0 ? (
                        <p className="text-sm text-stone-500">Join this Islamiyya to view the member directory.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {community.memberships.map((m) => (
                                <div key={m.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                                    <div className="text-sm font-semibold text-stone-900">
                                        {m.user?.full_name || m.user?.username}
                                    </div>
                                    <div className="text-xs capitalize text-emerald-800 font-medium">
                                        {m.role === 'member' ? 'Student' : m.role}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IslamiyyaDetailPage;
