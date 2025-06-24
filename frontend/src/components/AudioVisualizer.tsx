import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isRecording: boolean;
    height?: number;
    width?: number;
    barCount?: number;
    color?: string;
    backgroundColor?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    stream,
    isRecording,
    height = 100,
    width = 400,
    barCount = 32,
    color = '#007bff',
    backgroundColor = '#f8f9fa',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    useEffect(() => {
        if (stream && isRecording) {
            setupAudioAnalysis();
        } else {
            cleanup();
        }

        return cleanup;
    }, [stream, isRecording]);

    const setupAudioAnalysis = () => {
        if (!stream) return;

        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = context.createAnalyser();
            const source = context.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            setAudioContext(context);
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            startVisualization();
        } catch (error) {
            console.error('Error setting up audio analysis:', error);
        }
    };

    const startVisualization = () => {
        const draw = () => {
            if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
                return;
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            // Clear canvas
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            // Calculate bar dimensions
            const barWidth = width / barCount;
            const dataStep = Math.floor(dataArrayRef.current.length / barCount);

            // Draw frequency bars
            for (let i = 0; i < barCount; i++) {
                const dataIndex = i * dataStep;
                const barHeight = (dataArrayRef.current[dataIndex] / 255) * height;
                
                // Create gradient effect
                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color + '80'); // Add transparency

                ctx.fillStyle = gradient;
                ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
            }

            // Draw rhythm indicator (average amplitude)
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
            const rhythmHeight = (average / 255) * height;
            
            // Draw rhythm line
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, height - rhythmHeight);
            ctx.lineTo(width, height - rhythmHeight);
            ctx.stroke();

            // Draw rhythm pulse circle
            const pulseRadius = Math.max(5, (average / 255) * 20);
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(width - 30, height - rhythmHeight, pulseRadius, 0, 2 * Math.PI);
            ctx.fill();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();
    };

    const cleanup = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }
        analyserRef.current = null;
        dataArrayRef.current = null;
        setAudioContext(null);
    };

    const drawStaticWave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw static wave pattern
        ctx.strokeStyle = color + '40'; // Semi-transparent
        ctx.lineWidth = 2;
        ctx.beginPath();

        const centerY = height / 2;
        const amplitude = height * 0.1;
        
        for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin((x / width) * Math.PI * 4) * amplitude;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw "Ready to record" text
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Ready to record...', width / 2, centerY + 30);
    };

    useEffect(() => {
        if (!isRecording) {
            drawStaticWave();
        }
    }, [isRecording, color, backgroundColor, width, height]);

    return (
        <div
            style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    backgroundColor: backgroundColor,
                }}
            />
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                {isRecording ? (
                    <>
                        <div style={{ color: '#ff4444', fontWeight: 'bold' }}>
                            🔴 Recording - Speak clearly into your microphone
                        </div>
                        <div style={{ marginTop: '4px' }}>
                            Red line shows rhythm intensity
                        </div>
                    </>
                ) : (
                    <div>Audio visualizer ready</div>
                )}
            </div>
        </div>
    );
};

export default AudioVisualizer;
