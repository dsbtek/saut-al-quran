export interface CachedAyah {
    numberInSurah: number;
    arabicText: string;
    englishText: string;
    audioUrl: string;
}

export interface CachedSurahData {
    key: string; // `${surahNumber}_${reciterId}`
    surahNumber: number;
    reciterId: string;
    ayahs: CachedAyah[];
    cachedAt: number;
    audioPrefetched: boolean;
}

export interface HifzPreferences {
    surahNumber: number;
    reciterId: string;
    ayahIndex: number;
    repeatPerAyah: number;
    rangeStart: number;
    rangeEnd: number;
    playbackRate: number;
}

export const RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', arabic: 'مشاري راشد العفاسي' },
    { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', arabic: 'محمود خليل الحصري' },
    { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', arabic: 'عبد الباسط عبد الصمد' },
    { id: 'ar.minshawi', name: 'Muhammad Siddiq Al-Minshawi', arabic: 'محمد صديق المنشاوي' },
];

const PREFS_KEY = 'saut_hifz_preferences_v1';
const AUDIO_CACHE_NAME = 'saut-quran-hifz-audio-v1';
const DB_NAME = 'SautAlQuranHifzDB';
const STORE_NAME = 'cachedSurahs';

export function loadHifzPreferences(): HifzPreferences {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) {
            return JSON.parse(raw) as HifzPreferences;
        }
    } catch {
        // Ignore storage error
    }
    return {
        surahNumber: 1,
        reciterId: 'ar.alafasy',
        ayahIndex: 0,
        repeatPerAyah: 3,
        rangeStart: 1,
        rangeEnd: 7,
        playbackRate: 1,
    };
}

export function saveHifzPreferences(prefs: HifzPreferences): void {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // Ignore storage error
    }
}

function openHifzDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
    });
}

export async function getCachedSurah(
    surahNumber: number,
    reciterId: string,
): Promise<CachedSurahData | null> {
    try {
        const db = await openHifzDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(`${surahNumber}_${reciterId}`);
            req.onsuccess = () => resolve((req.result as CachedSurahData) || null);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return null;
    }
}

export async function saveCachedSurah(data: CachedSurahData): Promise<void> {
    try {
        const db = await openHifzDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(data);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch {
        // Ignore IDB errors
    }
}

export async function fetchOrLoadSurah(
    surahNumber: number,
    reciterId: string,
): Promise<CachedSurahData> {
    const cached = await getCachedSurah(surahNumber, reciterId);
    if (cached && cached.ayahs.length > 0) {
        return cached;
    }

    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,${reciterId}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Could not load Surah text & audio. Please check your connection.');
    }
    const json = await res.json();
    const editions = json.data || [];
    const arabicEd = editions[0]?.ayahs || [];
    const englishEd = editions[1]?.ayahs || [];
    const audioEd = editions[2]?.ayahs || [];

    const ayahs: CachedAyah[] = arabicEd.map((a: { numberInSurah: number; text: string }, idx: number) => ({
        numberInSurah: a.numberInSurah,
        arabicText: a.text,
        englishText: englishEd[idx]?.text || '',
        audioUrl: audioEd[idx]?.audio || '',
    }));

    const data: CachedSurahData = {
        key: `${surahNumber}_${reciterId}`,
        surahNumber,
        reciterId,
        ayahs,
        cachedAt: Date.now(),
        audioPrefetched: false,
    };
    await saveCachedSurah(data);
    return data;
}

export async function prefetchSurahAudio(
    surahData: CachedSurahData,
    onProgress?: (done: number, total: number) => void,
): Promise<CachedSurahData> {
    if (!('caches' in window)) {
        throw new Error('Offline audio caching is not supported in this browser.');
    }
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const total = surahData.ayahs.length;
    let done = 0;

    for (const ayah of surahData.ayahs) {
        if (ayah.audioUrl) {
            const existing = await cache.match(ayah.audioUrl);
            if (!existing) {
                try {
                    const resp = await fetch(ayah.audioUrl);
                    if (resp.ok) {
                        await cache.put(ayah.audioUrl, resp);
                    }
                } catch {
                    // Continue caching remaining ayahs
                }
            }
        }
        done += 1;
        onProgress?.(done, total);
    }

    const updated: CachedSurahData = { ...surahData, audioPrefetched: true };
    await saveCachedSurah(updated);
    return updated;
}

export async function resolvePlayableAudioUrl(audioUrl: string): Promise<string> {
    if (!audioUrl) return '';
    if ('caches' in window) {
        try {
            const cache = await caches.open(AUDIO_CACHE_NAME);
            const match = await cache.match(audioUrl);
            if (match) {
                const blob = await match.blob();
                return URL.createObjectURL(blob);
            }
        } catch {
            // Fall back to network URL
        }
    }
    return audioUrl;
}
