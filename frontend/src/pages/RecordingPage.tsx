import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { apiService } from '../services/api';
import AudioVisualizer from '../components/AudioVisualizer';
import { SURAHS } from '../data/surahs';

const RecordingPage: React.FC = () => {
    const [surahQuery, setSurahQuery] = useState('');
    const [selectedSurahName, setSelectedSurahName] = useState('Al-Fatiha');
    const [ayahRange, setAyahRange] = useState({ start: 1, end: 7 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const selectedSurah = useMemo(
        () => SURAHS.find((s) => s.name === selectedSurahName) || SURAHS[0],
        [selectedSurahName],
    );

    const filteredSurahs = useMemo(() => {
        const q = surahQuery.trim().toLowerCase();
        if (!q) return SURAHS;
        return SURAHS.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.arabicName.includes(q) ||
                String(s.number) === q,
        );
    }, [surahQuery]);

    const {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        audioURL,
        mediaStream,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        clearRecording,
    } = useAudioRecorder();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSurahChange = (name: string) => {
        setSelectedSurahName(name);
        const surah = SURAHS.find((s) => s.name === name);
        if (surah) {
            setAyahRange({ start: 1, end: Math.min(7, surah.ayahCount) });
        }
    };

    const handleStartRecording = async () => {
        setSubmitStatus(null);
        try {
            await startRecording();
        } catch (error) {
            setSubmitStatus({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Could not access microphone. Please check permissions.',
            });
        }
    };

    const handleSubmitRecording = async () => {
        if (!audioBlob) return;
        if (ayahRange.start < 1 || ayahRange.end < ayahRange.start || ayahRange.end > selectedSurah.ayahCount) {
            setSubmitStatus({
                type: 'error',
                message: `Please choose an Ayah range between 1 and ${selectedSurah.ayahCount} for ${selectedSurah.name}.`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const result = await apiService.uploadRecitation({
                surah_name: selectedSurah.name,
                ayah_start: ayahRange.start,
                ayah_end: ayahRange.end,
                audioBlob,
                duration: recordingTime,
            });

            setSubmitStatus({
                type: 'success',
                message: result.queuedOffline
                    ? 'You are offline — your recitation was saved locally and will upload automatically when reconnected.'
                    : 'Recitation submitted successfully for scholar review!',
            });
            clearRecording();
        } catch (error) {
            setSubmitStatus({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to submit recording. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Record Recitation</h1>
                    <p className="text-sm text-stone-600">
                        Select a Surah and Ayah range, then record using your microphone.
                    </p>
                </div>
                <Link
                    to="/feedback"
                    className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                    My Submissions →
                </Link>
            </div>

            {submitStatus && (
                <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                        submitStatus.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                >
                    {submitStatus.message}
                </div>
            )}

            {/* Surah & Ayah selector */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Search Surah
                        </label>
                        <input
                            type="text"
                            value={surahQuery}
                            onChange={(e) => setSurahQuery(e.target.value)}
                            placeholder="e.g. Mulk, 67, الملك"
                            disabled={isRecording}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                            Surah ({selectedSurah.ayahCount} Ayahs)
                        </label>
                        <select
                            value={selectedSurahName}
                            onChange={(e) => handleSurahChange(e.target.value)}
                            disabled={isRecording}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none"
                        >
                            {filteredSurahs.map((s) => (
                                <option key={s.number} value={s.name}>
                                    {s.number}. {s.name} — {s.arabicName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-stone-100">
                    <div>
                        <label className="mr-2 text-sm font-medium text-stone-700">From Ayah</label>
                        <input
                            type="number"
                            min={1}
                            max={selectedSurah.ayahCount}
                            value={ayahRange.start}
                            disabled={isRecording}
                            onChange={(e) =>
                                setAyahRange((prev) => ({
                                    ...prev,
                                    start: Math.max(1, parseInt(e.target.value, 10) || 1),
                                }))
                            }
                            className="w-20 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="mr-2 text-sm font-medium text-stone-700">To Ayah</label>
                        <input
                            type="number"
                            min={ayahRange.start}
                            max={selectedSurah.ayahCount}
                            value={ayahRange.end}
                            disabled={isRecording}
                            onChange={(e) =>
                                setAyahRange((prev) => ({
                                    ...prev,
                                    end: Math.max(prev.start, parseInt(e.target.value, 10) || prev.start),
                                }))
                            }
                            className="w-20 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm"
                        />
                    </div>
                    <div className="ml-auto font-arabic text-xl text-emerald-900">
                        سورة {selectedSurah.arabicName}
                    </div>
                </div>
            </div>

            {/* Recorder card */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm text-center space-y-5">
                <div className="flex justify-center overflow-hidden rounded-xl bg-stone-50 p-3 border border-stone-100">
                    <AudioVisualizer
                        stream={mediaStream}
                        isRecording={isRecording && !isPaused}
                        height={110}
                        width={520}
                        barCount={44}
                    />
                </div>

                {!isRecording && !audioBlob && (
                    <button
                        onClick={handleStartRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-8 py-3.5 text-base font-semibold text-white hover:bg-emerald-900 shadow-sm transition"
                    >
                        🎤 Start Recording
                    </button>
                )}

                {isRecording && (
                    <div className="space-y-4">
                        <div className="font-mono text-2xl font-bold text-red-600">
                            ● {formatTime(recordingTime)}
                        </div>
                        <div className="flex justify-center gap-3">
                            {!isPaused ? (
                                <button
                                    onClick={pauseRecording}
                                    className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                                >
                                    ⏸ Pause
                                </button>
                            ) : (
                                <button
                                    onClick={resumeRecording}
                                    className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                                >
                                    ▶ Resume
                                </button>
                            )}
                            <button
                                onClick={stopRecording}
                                className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
                            >
                                ⏹ Stop
                            </button>
                        </div>
                    </div>
                )}

                {audioBlob && !isRecording && (
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-stone-700">
                            Preview ({formatTime(recordingTime)}) — {(audioBlob.size / 1024).toFixed(0)} KB
                        </div>
                        <audio
                            controls
                            src={audioURL || undefined}
                            className="mx-auto w-full max-w-md"
                        />
                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                onClick={handleSubmitRecording}
                                disabled={isSubmitting}
                                className="rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Uploading...' : '📤 Submit for Review'}
                            </button>
                            <button
                                onClick={clearRecording}
                                disabled={isSubmitting}
                                className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                            >
                                🗑 Re-record
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecordingPage;
