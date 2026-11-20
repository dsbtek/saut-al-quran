import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLecture } from '../types';
import { apiService } from '../services/api';

const LectureRoomPage: React.FC = () => {
    const { lectureId } = useParams<{ lectureId: string }>();
    const [lecture, setLecture] = useState<PublicLecture | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (lectureId) {
            apiService
                .getLecture(parseInt(lectureId, 10))
                .then(setLecture)
                .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load lecture'))
                .finally(() => setIsLoading(false));
        }
    }, [lectureId]);

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-stone-500">Entering lecture room...</div>;
    }

    if (error || !lecture) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                <p className="text-red-700 mb-3">{error || 'Lecture not found'}</p>
                <Link to="/communities" className="text-sm font-semibold text-emerald-800 hover:underline">
                    ← Back to Islamiyyas
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    to={`/communities/${lecture.community_id}`}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                    ← Back to {lecture.community_name || 'Islamiyya'}
                </Link>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        lecture.status === 'live'
                            ? 'bg-red-100 text-red-700'
                            : lecture.status === 'ended'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-100 text-amber-900'
                    }`}
                >
                    {lecture.status === 'live' ? '● Live Broadcast' : lecture.status}
                </span>
            </div>

            {/* Stream Embed Player */}
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 shadow-sm">
                {lecture.stream_embed_url ? (
                    <div className="aspect-video w-full">
                        <iframe
                            src={lecture.stream_embed_url}
                            title={lecture.title}
                            className="h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <div className="flex aspect-video flex-col items-center justify-center p-8 text-center text-white">
                        <div className="text-4xl mb-3">🕌</div>
                        <h2 className="text-xl font-bold">{lecture.title}</h2>
                        <p className="mt-2 max-w-md text-sm text-stone-300">
                            Broadcast starts {new Date(lecture.scheduled_at).toLocaleString()}. Use the social
                            stream links below to watch or share live.
                        </p>
                    </div>
                )}
            </div>

            {/* Lecture Info & Social Simulcast Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        {lecture.community_name} {lecture.topic ? `• ${lecture.topic}` : ''}
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900">{lecture.title}</h1>
                    <p className="text-sm font-medium text-stone-700">
                        Speaker: {lecture.speaker_name}
                    </p>
                    {lecture.description && (
                        <p className="pt-2 text-sm text-stone-600 leading-relaxed">{lecture.description}</p>
                    )}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-stone-900">Watch on Social Platforms</h3>
                    {lecture.stream_targets.length === 0 ? (
                        <p className="text-xs text-stone-500">No external social streams linked.</p>
                    ) : (
                        <div className="space-y-2">
                            {lecture.stream_targets.map((target, i) => (
                                <a
                                    key={i}
                                    href={target.watch_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-semibold capitalize text-stone-800 hover:border-emerald-600 hover:bg-emerald-50/40 transition"
                                >
                                    <span>{target.platform} Live</span>
                                    <span className="text-xs text-emerald-800">Open ↗</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LectureRoomPage;
