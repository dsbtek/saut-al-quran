import React, { useState, useCallback } from 'react';

export interface Marker {
    id: string;
    time: number;
    label: string;
    color?: string;
    description?: string;
    category?: 'pronunciation' | 'tajweed' | 'rhythm' | 'general';
}

export interface LoopRegion {
    id: string;
    start: number;
    end: number;
    label: string;
    color?: string;
    isActive?: boolean;
}

interface MarkerManagerProps {
    markers: Marker[];
    loopRegions: LoopRegion[];
    duration: number;
    currentTime: number;
    onMarkerAdd: (marker: Omit<Marker, 'id'>) => void;
    onMarkerUpdate: (id: string, updates: Partial<Marker>) => void;
    onMarkerDelete: (id: string) => void;
    onLoopRegionAdd: (region: Omit<LoopRegion, 'id'>) => void;
    onLoopRegionUpdate: (id: string, updates: Partial<LoopRegion>) => void;
    onLoopRegionDelete: (id: string) => void;
    onSeekTo: (time: number) => void;
    onLoopToggle: (regionId: string) => void;
}

const MarkerManager: React.FC<MarkerManagerProps> = ({
    markers,
    loopRegions,
    duration,
    currentTime,
    onMarkerAdd,
    onMarkerUpdate,
    onMarkerDelete,
    onLoopRegionAdd,
    onLoopRegionUpdate,
    onLoopRegionDelete,
    onSeekTo,
    onLoopToggle
}) => {
    const [activeTab, setActiveTab] = useState<'markers' | 'loops'>('markers');
    const [showAddMarker, setShowAddMarker] = useState(false);
    const [showAddLoop, setShowAddLoop] = useState(false);
    const [editingMarker, setEditingMarker] = useState<string | null>(null);
    const [editingLoop, setEditingLoop] = useState<string | null>(null);
    const [newMarker, setNewMarker] = useState({
        time: 0,
        label: '',
        description: '',
        category: 'general' as const,
        color: '#f59e0b'
    });
    const [newLoop, setNewLoop] = useState({
        start: 0,
        end: 0,
        label: '',
        color: '#10b981'
    });

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddMarker = () => {
        if (newMarker.label.trim()) {
            onMarkerAdd({
                time: newMarker.time,
                label: newMarker.label.trim(),
                description: newMarker.description.trim(),
                category: newMarker.category,
                color: newMarker.color
            });
            setNewMarker({
                time: currentTime,
                label: '',
                description: '',
                category: 'general',
                color: '#f59e0b'
            });
            setShowAddMarker(false);
        }
    };

    const handleAddLoop = () => {
        if (newLoop.label.trim() && newLoop.start < newLoop.end) {
            onLoopRegionAdd({
                start: newLoop.start,
                end: newLoop.end,
                label: newLoop.label.trim(),
                color: newLoop.color
            });
            setNewLoop({
                start: 0,
                end: 0,
                label: '',
                color: '#10b981'
            });
            setShowAddLoop(false);
        }
    };

    const categoryColors = {
        pronunciation: '#ef4444',
        tajweed: '#8b5cf6',
        rhythm: '#06b6d4',
        general: '#f59e0b'
    };

    const categoryLabels = {
        pronunciation: 'Pronunciation',
        tajweed: 'Tajweed',
        rhythm: 'Rhythm',
        general: 'General'
    };

    return (
        <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Tab Headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                <button
                    onClick={() => setActiveTab('markers')}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: activeTab === 'markers' ? '#f3f4f6' : 'white',
                        border: 'none',
                        borderBottom: activeTab === 'markers' ? '2px solid #3b82f6' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    🔖 Markers ({markers.length})
                </button>
                <button
                    onClick={() => setActiveTab('loops')}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: activeTab === 'loops' ? '#f3f4f6' : 'white',
                        border: 'none',
                        borderBottom: activeTab === 'loops' ? '2px solid #3b82f6' : 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    🔄 Loops ({loopRegions.length})
                </button>
            </div>

            <div style={{ padding: '16px' }}>
                {activeTab === 'markers' && (
                    <div>
                        {/* Add Marker Button */}
                        <button
                            onClick={() => {
                                setNewMarker(prev => ({ ...prev, time: currentTime }));
                                setShowAddMarker(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginBottom: '16px',
                                fontSize: '14px'
                            }}
                        >
                            + Add Marker at {formatTime(currentTime)}
                        </button>

                        {/* Add Marker Form */}
                        {showAddMarker && (
                            <div style={{ 
                                backgroundColor: '#f9fafb', 
                                padding: '12px', 
                                borderRadius: '6px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                        Time: {formatTime(newMarker.time)}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration}
                                        step="0.1"
                                        value={newMarker.time}
                                        onChange={(e) => setNewMarker(prev => ({ ...prev, time: parseFloat(e.target.value) }))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Marker label"
                                        value={newMarker.label}
                                        onChange={(e) => setNewMarker(prev => ({ ...prev, label: e.target.value }))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '6px 8px', 
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <textarea
                                        placeholder="Description (optional)"
                                        value={newMarker.description}
                                        onChange={(e) => setNewMarker(prev => ({ ...prev, description: e.target.value }))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '6px 8px', 
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            minHeight: '60px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <select
                                        value={newMarker.category}
                                        onChange={(e) => setNewMarker(prev => ({ 
                                            ...prev, 
                                            category: e.target.value as any,
                                            color: categoryColors[e.target.value as keyof typeof categoryColors]
                                        }))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '6px 8px', 
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleAddMarker}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddMarker(false)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Markers List */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {markers.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                    No markers added yet
                                </p>
                            ) : (
                                markers.map(marker => (
                                    <div
                                        key={marker.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            marginBottom: '8px',
                                            backgroundColor: '#fafafa'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '4px',
                                                height: '40px',
                                                backgroundColor: marker.color,
                                                marginRight: '12px',
                                                borderRadius: '2px'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                                    {marker.label}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '12px', 
                                                    color: '#6b7280',
                                                    backgroundColor: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #d1d5db'
                                                }}>
                                                    {categoryLabels[marker.category || 'general']}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                {formatTime(marker.time)}
                                                {marker.description && (
                                                    <span style={{ marginLeft: '8px' }}>• {marker.description}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => onSeekTo(marker.time)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Go
                                            </button>
                                            <button
                                                onClick={() => onMarkerDelete(marker.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'loops' && (
                    <div>
                        {/* Add Loop Button */}
                        <button
                            onClick={() => setShowAddLoop(true)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginBottom: '16px',
                                fontSize: '14px'
                            }}
                        >
                            + Create Loop Region
                        </button>

                        {/* Add Loop Form */}
                        {showAddLoop && (
                            <div style={{ 
                                backgroundColor: '#f9fafb', 
                                padding: '12px', 
                                borderRadius: '6px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Loop label"
                                        value={newLoop.label}
                                        onChange={(e) => setNewLoop(prev => ({ ...prev, label: e.target.value }))}
                                        style={{ 
                                            width: '100%', 
                                            padding: '6px 8px', 
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            Start: {formatTime(newLoop.start)}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            step="0.1"
                                            value={newLoop.start}
                                            onChange={(e) => setNewLoop(prev => ({ ...prev, start: parseFloat(e.target.value) }))}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            End: {formatTime(newLoop.end)}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            step="0.1"
                                            value={newLoop.end}
                                            onChange={(e) => setNewLoop(prev => ({ ...prev, end: parseFloat(e.target.value) }))}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleAddLoop}
                                        disabled={newLoop.start >= newLoop.end || !newLoop.label.trim()}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: newLoop.start >= newLoop.end || !newLoop.label.trim() ? '#9ca3af' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: newLoop.start >= newLoop.end || !newLoop.label.trim() ? 'not-allowed' : 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => setShowAddLoop(false)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loops List */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {loopRegions.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                    No loop regions created yet
                                </p>
                            ) : (
                                loopRegions.map(loop => (
                                    <div
                                        key={loop.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            marginBottom: '8px',
                                            backgroundColor: loop.isActive ? '#ecfdf5' : '#fafafa'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '4px',
                                                height: '40px',
                                                backgroundColor: loop.color,
                                                marginRight: '12px',
                                                borderRadius: '2px'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                                {loop.label}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                {formatTime(loop.start)} → {formatTime(loop.end)} 
                                                <span style={{ marginLeft: '8px' }}>
                                                    ({formatTime(loop.end - loop.start)} duration)
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => onLoopToggle(loop.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: loop.isActive ? '#ef4444' : '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {loop.isActive ? 'Stop' : 'Loop'}
                                            </button>
                                            <button
                                                onClick={() => onSeekTo(loop.start)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Go
                                            </button>
                                            <button
                                                onClick={() => onLoopRegionDelete(loop.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkerManager;
