import React, { useState } from 'react';
import { Marker } from '../types';

interface MarkerListProps {
  markers: Marker[];
  onMarkerClick: (marker: Marker) => void;
  onMarkerDelete?: (markerId: number) => void;
  onMarkerUpdate?: (markerId: number, updates: Partial<Marker>) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  markers,
  onMarkerClick,
  onMarkerDelete,
  onMarkerUpdate,
}) => {
  const [editingMarker, setEditingMarker] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ label: '', description: '' });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditStart = (marker: Marker) => {
    setEditingMarker(marker.id);
    setEditForm({
      label: marker.label,
      description: marker.description || '',
    });
  };

  const handleEditSave = (markerId: number) => {
    if (onMarkerUpdate) {
      onMarkerUpdate(markerId, editForm);
    }
    setEditingMarker(null);
  };

  const handleEditCancel = () => {
    setEditingMarker(null);
    setEditForm({ label: '', description: '' });
  };

  const sortedMarkers = [...markers].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
      <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
        <h4 style={{ margin: 0 }}>Markers ({markers.length})</h4>
      </div>
      
      {sortedMarkers.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          No markers added yet. Double-click on the waveform to add markers.
        </div>
      ) : (
        <div>
          {sortedMarkers.map((marker) => (
            <div
              key={marker.id}
              style={{
                padding: '10px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                backgroundColor: '#fff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              {editingMarker === marker.id ? (
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>[{formatTime(marker.timestamp)}]</strong>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="Marker label"
                      style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        marginBottom: '5px',
                      }}
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => handleEditSave(marker.id)}
                      style={{
                        padding: '5px 10px',
                        marginRight: '5px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    onClick={() => onMarkerClick(marker)}
                    style={{ marginBottom: '5px' }}
                  >
                    <strong>[{formatTime(marker.timestamp)}]</strong> {marker.label}
                  </div>
                  {marker.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '5px',
                        fontStyle: 'italic',
                      }}
                    >
                      {marker.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick(marker);
                      }}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Jump to
                    </button>
                    {onMarkerUpdate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(marker);
                        }}
                        style={{
                          padding: '3px 8px',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {onMarkerDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this marker?')) {
                            onMarkerDelete(marker.id);
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkerList;
