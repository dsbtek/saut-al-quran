import React from 'react';

export const getHijriDateString = (): string => {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    } catch {
        return '';
    }
};

export const IslamicPattern: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        aria-hidden="true"
        className={`pointer-events-none select-none ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
    >
        <defs>
            <pattern id="islamic-star" width="48" height="48" patternUnits="userSpaceOnUse">
                <path
                    d="M24 0L29.5 18.5L48 24L29.5 29.5L24 48L18.5 29.5L0 24L18.5 18.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.75"
                    strokeOpacity="0.16"
                />
                <circle
                    cx="24"
                    cy="24"
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.6"
                    strokeOpacity="0.14"
                />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star)" />
    </svg>
);

export const BismillahBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <div className={`text-center ${compact ? 'py-1' : 'py-2'}`}>
        <p className="font-arabic text-lg sm:text-xl text-amber-300/95 tracking-wide">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
    </div>
);
