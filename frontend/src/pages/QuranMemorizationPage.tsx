import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SURAHS } from '../data/surahs';
import {
    CachedSurahData,
    RECITERS,
    fetchOrLoadSurah,
    loadHifzPreferences,
    prefetchSurahAudio,
    resolvePlayableAudioUrl,
    saveHifzPreferences,
} from '../services/quranCache';

const QuranMemorizationPage: React.FC = () => {
    const initialPrefs = useRef(loadHifzPreferences());

    const [surahNumber, setSurahNumber] = useState(initialPrefs.current.surahNumber);
    const [reciterId, setReciterId] = useState(initialPrefs.current.reciterId);
    const [ayahIndex, setAyahIndex] = useState(initialPrefs.current.ayahIndex);
    const [repeatPerAyah, setRepeatPerAyah] = useState(initialPrefs.current.repeatPerAyah);
    const [rangeStart, setRangeStart] = useState(initialPrefs.current.rangeStart);
    const [rangeEnd, setRangeEnd] = useState(initialPrefs.current.rangeEnd);
    const [playbackRate, setPlaybackRate] = useState(initialPrefs.current.playbackRate);

    const [surahData, setSurahData] = useState<CachedSurahData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [repeatCounter, setRepeatCounter] = useState(1);
    const [prefetchProgress, setPrefetchProgress] = useState<{ done: number; total: number } | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);

    const selectedSurahMeta = SURAHS.find((s) => s.number === surahNumber) || SURAHS[0];

    // Persist preferences & position whenever they change
    useEffect(() => {
        saveHifzPreferences({
            surahNumber,
            reciterId,
            ayahIndex,
            repeatPerAyah,
            rangeStart,
            rangeEnd,
            playbackRate,
        });
    }, [surahNumber, reciterId, ayahIndex, repeatPerAyah, rangeStart, rangeEnd, playbackRate]);

    // Load Surah text + audio metadata (from IndexedDB cache or API)
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError('');
        setIsPlaying(false);
        audioRef.current?.pause();

        fetchOrLoadSurah(surahNumber, reciterId)
            .then((data) => {
                if (cancelled) return;
                setSurahData(data);
                const maxAyah = data.ayahs.length || 1;
                setRangeStart((prev) => Math.min(Math.max(1, prev), maxAyah));
                setRangeEnd((prev) => (prev < 1 || prev > maxAyah ? maxAyah : prev));
                setAyahIndex((prev) => Math.min(prev, maxAyah - 1));
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load Surah');
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [surahNumber, reciterId]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    const playAyahAtIndex = async (idx: number, resetRepeat = true) => {
        if (!surahData || !surahData.ayahs[idx]) return;
        const ayah = surahData.ayahs[idx];
        setAyahIndex(idx);
        if (resetRepeat) setRepeatCounter(1);

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        const playableUrl = await resolvePlayableAudioUrl(ayah.audioUrl);
        if (playableUrl.startsWith('blob:')) {
            objectUrlRef.current = playableUrl;
        }

        if (audioRef.current) {
            audioRef.current.src = playableUrl;
            audioRef.current.playbackRate = playbackRate;
            await audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleAudioEnded = () => {
        if (!surahData) return;
        if (repeatCounter < repeatPerAyah) {
            setRepeatCounter((c) => c + 1);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }
            return;
        }

        const startIdx = Math.max(0, rangeStart - 1);
        const endIdx = Math.min(surahData.ayahs.length - 1, rangeEnd - 1);
        const nextIdx = ayahIndex + 1;

        if (nextIdx <= endIdx) {
            playAyahAtIndex(nextIdx, true);
        } else {
            // Loop back to start of memorization range
            playAyahAtIndex(startIdx, true);
        }
    };

    const handleTogglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else if (audioRef.current.src) {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        } else {
            playAyahAtIndex(ayahIndex, true);
        }
    };

    const handlePrefetchOffline = async () => {
        if (!surahData) return;
        try {
            setPrefetchProgress({ done: 0, total: surahData.ayahs.length });
            const updated = await prefetchSurahAudio(surahData, (done, total) => {
                setPrefetchProgress({ done, total });
            });
            setSurahData(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Offline caching failed');
        } finally {
            setPrefetchProgress(null);
        }
    };

    const handleSurahSelect = (num: number) => {
        const meta = SURAHS.find((s) => s.number === num) || SURAHS[0];
        setSurahNumber(num);
        setAyahIndex(0);
        setRangeStart(1);
        setRangeEnd(meta.ayahCount);
        setRepeatCounter(1);
    };

    const currentAyah = surahData?.ayahs[ayahIndex];

    return (
        <div className="space-y-6">
            <audio ref={audioRef} onEnded={handleAudioEnded} />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">
                        Full Qur&apos;an Memorization (Hifz) Player
                    </h1>
                    <p className="text-sm text-stone-600">
                        Listen Ayah-by-Ayah, set repeat loops, and cache Surahs for offline memorization.
                    </p>
                </div>
                <Link
                    to="/record"
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400"
                >
                    🎤 Practice &amp; Record This Surah →
                </Link>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Controls Bar */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">Surah (1–114)</label>
                        <select
                            value={surahNumber}
                            onChange={(e) => handleSurahSelect(parseInt(e.target.value, 10))}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                            {SURAHS.map((s) => (
                                <option key={s.number} value={s.number}>
                                    {s.number}. {s.name} ({s.arabicName})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">Qari / Reciter</label>
                        <select
                            value={reciterId}
                            onChange={(e) => setReciterId(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                            {RECITERS.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">
                            Repeat Each Ayah
                        </label>
                        <select
                            value={repeatPerAyah}
                            onChange={(e) => setRepeatPerAyah(parseInt(e.target.value, 10))}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value={1}>1x (Continuous)</option>
                            <option value={3}>3x per Ayah</option>
                            <option value={5}>5x per Ayah</option>
                            <option value={10}>10x per Ayah</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500">
                            Ayah Loop Range (1–{selectedSurahMeta.ayahCount})
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={selectedSurahMeta.ayahCount}
                                value={rangeStart}
                                onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-20 rounded-lg border border-stone-300 px-2 py-2 text-sm"
                            />
                            <span className="text-xs text-stone-500">to</span>
                            <input
                                type="number"
                                min={rangeStart}
                                max={selectedSurahMeta.ayahCount}
                                value={rangeEnd}
                                onChange={(e) =>
                                    setRangeEnd(
                                        Math.min(
                                            selectedSurahMeta.ayahCount,
                                            Math.max(rangeStart, parseInt(e.target.value, 10) || rangeStart),
                                        ),
                                    )
                                }
                                className="w-20 rounded-lg border border-stone-300 px-2 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Transport & Offline Cache */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => playAyahAtIndex(Math.max(0, ayahIndex - 1), true)}
                            disabled={isLoading || ayahIndex <= 0}
                            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40"
                        >
                            ⏮ Prev
                        </button>
                        <button
                            type="button"
                            onClick={handleTogglePlay}
                            disabled={isLoading || !surahData}
                            className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                        >
                            {isPlaying ? '⏸ Pause' : '▶ Play'}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                playAyahAtIndex(
                                    Math.min((surahData?.ayahs.length || 1) - 1, ayahIndex + 1),
                                    true,
                                )
                            }
                            disabled={isLoading || !surahData || ayahIndex >= surahData.ayahs.length - 1}
                            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-40"
                        >
                            Next ⏭
                        </button>
                        <span className="ml-2 text-xs font-medium text-stone-600">
                            Ayah {currentAyah?.numberInSurah || 1} • Repeat {repeatCounter}/{repeatPerAyah}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1">
                            {[0.75, 1, 1.25].map((rate) => (
                                <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setPlaybackRate(rate)}
                                    className={`rounded px-2 py-1 text-xs font-semibold ${
                                        playbackRate === rate
                                            ? 'bg-emerald-100 text-emerald-900'
                                            : 'text-stone-600 hover:bg-stone-100'
                                    }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>

                        {surahData?.audioPrefetched ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                                ✓ Saved Offline
                            </span>
                        ) : prefetchProgress ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                Caching {prefetchProgress.done}/{prefetchProgress.total}...
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handlePrefetchOffline}
                                disabled={isLoading || !surahData}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                ⬇ Save Surah Offline
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Ayahs List */}
            {isLoading ? (
                <div className="py-12 text-center text-sm text-stone-500">
                    Loading Surah {selectedSurahMeta.name}...
                </div>
            ) : (
                <div className="space-y-3">
                    {surahData?.ayahs.map((ayah, idx) => {
                        const active = idx === ayahIndex;
                        const inRange = ayah.numberInSurah >= rangeStart && ayah.numberInSurah <= rangeEnd;
                        return (
                            <div
                                key={ayah.numberInSurah}
                                onClick={() => playAyahAtIndex(idx, true)}
                                className={`cursor-pointer rounded-2xl border p-5 transition ${
                                    active
                                        ? 'border-emerald-700 bg-emerald-50/50 shadow-sm'
                                        : inRange
                                        ? 'border-stone-200 bg-white hover:border-emerald-400'
                                        : 'border-stone-100 bg-stone-50/60 opacity-70'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-amber-200">
                                        {ayah.numberInSurah}
                                    </span>
                                    <p
                                        dir="rtl"
                                        className="flex-1 text-right font-arabic text-2xl sm:text-3xl leading-loose text-stone-900"
                                    >
                                        {ayah.arabicText}
                                    </p>
                                </div>
                                {ayah.englishText && (
                                    <p className="mt-3 border-t border-stone-100 pt-2.5 text-sm text-stone-600">
                                        {ayah.englishText}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuranMemorizationPage;
