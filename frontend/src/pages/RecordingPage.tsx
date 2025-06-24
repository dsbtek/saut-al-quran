import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { apiService } from '../services/api';
import AudioVisualizer from '../components/AudioVisualizer';

const RecordingPage: React.FC = () => {
    const [selectedSurah, setSelectedSurah] = useState('');
    const [ayahRange, setAyahRange] = useState({ start: 1, end: 1 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

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

    const handleStartRecording = async () => {
        if (!selectedSurah) {
            alert('Please select a Surah first');
            return;
        }
        try {
            await startRecording();
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to start recording',
            );
        }
    };

    const handleSubmitRecording = async () => {
        if (!audioBlob || !selectedSurah) {
            alert('Please complete a recording first');
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                const base64Data = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix

                await apiService.createRecitation({
                    surah_name: selectedSurah,
                    ayah_start: ayahRange.start,
                    ayah_end: ayahRange.end,
                    audio_data: base64Data,
                    duration: recordingTime,
                });

                setSubmitMessage('Recording submitted successfully!');
                clearRecording();
                setSelectedSurah('');
                setAyahRange({ start: 1, end: 1 });
            };
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            setSubmitMessage('Failed to submit recording. Please try again.');
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <h2>Record Your Recitation</h2>

            <div style={{ marginBottom: '20px' }}>
                <Link to="/" className="nav-btn">
                    ← Back to Home
                </Link>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Select Surah:</label>
                    <select
                        value={selectedSurah}
                        onChange={(e) => setSelectedSurah(e.target.value)}
                        style={{ marginLeft: '10px', padding: '5px' }}
                    >
                        <option value="">Choose a Surah</option>
                        <option value="al-fatiha">Al-Fatiha</option>
                        <option value="al-baqarah">Al-Baqarah</option>
                        <option value="al-imran">Al-Imran</option>
                        {/* TODO: Add all Surahs */}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Ayah Range:</label>
                    <input
                        type="number"
                        value={ayahRange.start}
                        onChange={(e) =>
                            setAyahRange({
                                ...ayahRange,
                                start: parseInt(e.target.value),
                            })
                        }
                        style={{
                            marginLeft: '10px',
                            padding: '5px',
                            width: '60px',
                        }}
                        min="1"
                    />
                    <span style={{ margin: '0 10px' }}>to</span>
                    <input
                        type="number"
                        value={ayahRange.end}
                        onChange={(e) =>
                            setAyahRange({
                                ...ayahRange,
                                end: parseInt(e.target.value),
                            })
                        }
                        style={{ padding: '5px', width: '60px' }}
                        min="1"
                    />
                </div>
            </div>

            {submitMessage && (
                <div
                    style={{
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        backgroundColor: submitMessage.includes('success')
                            ? '#d4edda'
                            : '#f8d7da',
                        color: submitMessage.includes('success')
                            ? '#155724'
                            : '#721c24',
                        border: `1px solid ${
                            submitMessage.includes('success')
                                ? '#c3e6cb'
                                : '#f5c6cb'
                        }`,
                    }}
                >
                    {submitMessage}
                </div>
            )}

            {/* Audio Visualizer */}
            <div
                style={{
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <AudioVisualizer
                    stream={mediaStream}
                    isRecording={isRecording && !isPaused}
                    height={120}
                    width={500}
                    barCount={40}
                />
            </div>

            {/* Recording Controls */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                {!isRecording && !audioBlob && (
                    <button
                        onClick={handleStartRecording}
                        className="btn btn-primary"
                        style={{
                            fontSize: '18px',
                            padding: '15px 30px',
                            marginRight: '10px',
                        }}
                    >
                        🎤 Start Recording
                    </button>
                )}

                {isRecording && (
                    <div>
                        <div
                            style={{
                                marginBottom: '20px',
                                fontSize: '24px',
                                color: '#dc3545',
                            }}
                        >
                            🔴 {formatTime(recordingTime)}
                        </div>
                        <div>
                            {!isPaused ? (
                                <button
                                    onClick={pauseRecording}
                                    className="btn btn-secondary"
                                    style={{
                                        fontSize: '16px',
                                        padding: '10px 20px',
                                        marginRight: '10px',
                                    }}
                                >
                                    ⏸️ Pause
                                </button>
                            ) : (
                                <button
                                    onClick={resumeRecording}
                                    className="btn btn-primary"
                                    style={{
                                        fontSize: '16px',
                                        padding: '10px 20px',
                                        marginRight: '10px',
                                    }}
                                >
                                    ▶️ Resume
                                </button>
                            )}
                            <button
                                onClick={stopRecording}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '16px',
                                    padding: '10px 20px',
                                }}
                            >
                                ⏹️ Stop
                            </button>
                        </div>
                    </div>
                )}

                {audioBlob && !isRecording && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <h4>
                                Recording Complete ({formatTime(recordingTime)})
                            </h4>
                            <audio
                                controls
                                src={audioURL || undefined}
                                style={{ width: '100%', maxWidth: '400px' }}
                            />
                        </div>
                        <div>
                            <button
                                onClick={handleSubmitRecording}
                                className="btn btn-primary"
                                style={{
                                    fontSize: '16px',
                                    padding: '12px 24px',
                                    marginRight: '10px',
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Submitting...'
                                    : '📤 Submit Recording'}
                            </button>
                            <button
                                onClick={clearRecording}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '16px',
                                    padding: '12px 24px',
                                }}
                            >
                                🗑️ Clear & Re-record
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                }}
            >
                <h4>Recording Tips:</h4>
                <ul style={{ textAlign: 'left' }}>
                    <li>Ensure you're in a quiet environment</li>
                    <li>Speak clearly and at a moderate pace</li>
                    <li>Hold your device at a consistent distance</li>
                    <li>You can pause and resume recording as needed</li>
                    <li>Listen to your recording before submitting</li>
                </ul>
            </div>
        </div>
    );
};

export default RecordingPage;
