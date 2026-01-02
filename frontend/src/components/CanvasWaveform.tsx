import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onWaveformReady: (duration: number) => void;
  zoom?: number;
  width?: number;
  height?: number;
  waveformColor?: string;
  progressColor?: string;
}

const CanvasWaveform: React.FC<CanvasWaveformProps> = ({
  audioUrl,
  currentTime,
  duration,
  onSeek,
  onWaveformReady,
  zoom = 1,
  width = 800,
  height = 200,
  waveformColor = '#4f46e5',
  progressColor = '#6366f1'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data from audio
  useEffect(() => {
    const generateWaveform = async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        
        // Create audio context for analysis
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Get ArrayBuffer either from fetch or from data: URL
        let arrayBuffer: ArrayBuffer;
        if (audioUrl.startsWith('data:')) {
          // decode base64 data URL
          const base64 = audioUrl.split(',')[1] || '';
          const binary = atob(base64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
          arrayBuffer = bytes.buffer;
        } else {
          const response = await fetch(audioUrl);
          arrayBuffer = await response.arrayBuffer();
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the raw PCM data
        const channelData = audioBuffer.getChannelData(0); // Left channel
        let samples = Math.max(100, Math.floor(width * zoom)); // At least 100 points
        samples = Math.min(samples, channelData.length);
        const blockSize = Math.max(1, Math.floor(channelData.length / samples));
        
        const waveform: number[] = [];
        
        // Downsample and normalize the data
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          const start = Math.floor(i * blockSize);
          const end = Math.min(Math.floor(start + blockSize), channelData.length);
          
          for (let j = start; j < end; j++) {
            sum += Math.abs(channelData[j]);
          }
          
          const average = sum / Math.max(1, (end - start));
          waveform.push(average);
        }
        
        // Normalize to 0-1 range (guard against zero max)
        const max = Math.max(...waveform, 0.000001);
        const normalizedWaveform = waveform.map(value => value / max);
        
        setWaveformData(normalizedWaveform);
        onWaveformReady(audioBuffer.duration);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error generating waveform:', error);
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl, width, zoom, onWaveformReady]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle device pixel ratio for crisp drawing
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing operations

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    const progressWidth = (duration > 0) ? (currentTime / duration) * width : 0;
    const barWidth = Math.max(1, width / waveformData.length);

    // Draw background waveform
    ctx.fillStyle = waveformColor + '40'; // With transparency
    waveformData.forEach((value, index) => {
      const x = (index / waveformData.length) * width;
      const barHeight = value * (height * 0.8);
      
      ctx.fillRect(Math.round(x), Math.round(centerY - barHeight / 2), Math.ceil(barWidth), Math.round(barHeight));
    });

    // Draw progress waveform
    ctx.fillStyle = progressColor;
    waveformData.forEach((value, index) => {
      const x = (index / waveformData.length) * width;
      if (x <= progressWidth) {
        const barHeight = value * (height * 0.8);
        ctx.fillRect(Math.round(x), Math.round(centerY - barHeight / 2), Math.ceil(barWidth), Math.round(barHeight));
      }
    });

    // Draw progress line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressWidth, 0);
    ctx.lineTo(progressWidth, height);
    ctx.stroke();

  }, [waveformData, currentTime, duration, width, height, waveformColor, progressColor]);

  // Handle click to seek
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / width;
    const seekTime = progress * duration;

    onSeek(seekTime);
  }, [duration, width, onSeek]);

  if (isLoading) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="text-gray-500">Generating waveform...</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="cursor-pointer border border-gray-300 rounded-lg bg-white"
      style={{ width, height }}
    />
  );
};

export default CanvasWaveform;