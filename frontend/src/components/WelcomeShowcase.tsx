import React from 'react';

export const QuranicVerseBanner: React.FC = () => (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-sand-50 to-emerald-50/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                    Surah Al-Muzzammil (73:4)
                </span>
                <p className="mt-1 text-sm sm:text-base font-medium text-stone-800 italic">
                    &ldquo;And recite the Qur&apos;an with measured, rhythmic recitation.&rdquo;
                </p>
            </div>
            <p
                dir="rtl"
                className="font-arabic text-2xl sm:text-3xl text-emerald-950 leading-relaxed sm:text-right"
            >
                وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
            </p>
        </div>
    </div>
);

export const WelcomePillars: React.FC = () => {
    const pillars = [
        {
            icon: '🎙️',
            title: 'Recite & Submit',
            desc: 'Choose any of the 114 Surahs, record with real-time visualization, and upload even on low-bandwidth connections.',
        },
        {
            icon: '🎧',
            title: 'Scholar Tajweed Review',
            desc: 'Certified scholars annotate your waveform with timestamped text, voice notes, and A/B repeat practice loops.',
        },
        {
            icon: '🕌',
            title: 'Islamiyya Circles & Classes',
            desc: 'Join local Islamiyyas and enroll in dedicated Children, Adult Male, and Adult Women classes.',
        },
        {
            icon: '📡',
            title: 'Live Public Lectures',
            desc: 'Attend community lectures in-app or watch simulcasts streamed to Facebook, YouTube, and social platforms.',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((item) => (
                <div
                    key={item.title}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl border border-emerald-100">
                        {item.icon}
                    </div>
                    <h3 className="mt-3 text-base font-bold text-stone-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-stone-600 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
    );
};
