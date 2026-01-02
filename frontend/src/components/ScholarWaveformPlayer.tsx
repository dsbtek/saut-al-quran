import React from 'react';
import { Marker } from '../types';
import ResearchAudioAnalyzer, { AudioMarker } from './ResearchAudioAnalyzer';

interface ScholarWaveformPlayerProps {
    audioUrl: string;
    markers?: Marker[];
    onMarkerAdd?: (timestamp: number) => void;
    onMarkerClick?: (marker: Marker) => void;
    onTimeUpdate?: (time: number) => void;
    height?: number;
}

const ScholarWaveformPlayer: React.FC<ScholarWaveformPlayerProps> = ({
    audioUrl,
    markers = [],
    onMarkerAdd,
    onMarkerClick,
    onTimeUpdate,
    height = 128
}) => {
    // map Marker -> AudioMarker shape expected by ResearchAudioAnalyzer
    const mappedMarkers: AudioMarker[] = markers.map(m => ({
        id: m.id,
        timestamp: m.timestamp,
        label: m.label || '',
        color: (m as any).color || '#f59e0b',
        description: (m as any).description,
        category: (m as any).category,
        createdAt: (m as any).createdAt ? new Date((m as any).createdAt) : new Date(0)
    }));

    return (
        <div>
            <ResearchAudioAnalyzer
                audioUrl={audioUrl}
                markers={mappedMarkers}
                currentUser="system"
                height={height}
                onMarkerCreate={(m) => {
                    try {
                        onMarkerAdd?.(m.timestamp);
                    } catch (e) {
                        console.warn('onMarkerAdd callback error:', e);
                    }
                }}
                onMarkerClick={(m) => {
                    // forward marker click to parent using original Marker type when possible
                    try {
                        onMarkerClick?.({
                            id: m.id,
                            timestamp: m.timestamp,
                            label: m.label,
                            color: m.color
                        } as Marker);
                    } catch (e) {
                        console.warn('onMarkerClick forward error:', e);
                    }
                }}
                onTimeUpdate={(t) => {
                    try {
                        onTimeUpdate?.(t);
                    } catch (e) {
                        console.warn('onTimeUpdate forward error:', e);
                    }
                }}
            />
        </div>
    );
};

export default ScholarWaveformPlayer;