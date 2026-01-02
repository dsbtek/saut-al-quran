import React, { useRef, useEffect, useState, useCallback } from 'react';
import CanvasWaveform from './CanvasWaveform';
// use native HTMLAudioElement instead of howler to avoid external dependency

// Types
export interface AudioMarker {
  id: string;
  timestamp: number;
  label: string;
  color: string;
  description?: string;
  category?: string;
  createdAt: Date;
}

export interface AudioComment {
  id: string;
  timestamp: number;
  type: 'text' | 'voice';
  text?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  markerId?: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

export interface LoopRegion {
  id: string;
  start: number;
  end: number;
  label?: string;
  color: string;
  isActive: boolean;
}

interface ResearchAudioAnalyzerProps {
  audioUrl: string;
  markers?: AudioMarker[];
  comments?: AudioComment[];
  loops?: LoopRegion[];
  onMarkerCreate?: (marker: Omit<AudioMarker, 'id' | 'createdAt'>) => void;
  onCommentCreate?: (comment: Omit<AudioComment, 'id' | 'createdAt'>) => void;
  onLoopCreate?: (loop: Omit<LoopRegion, 'id'>) => void;
  onLoopUpdate?: (loopId: string, updates: Partial<LoopRegion>) => void;
  onLoopDelete?: (loopId: string) => void;
  currentUser: string;
  width?: number;
  height?: number;

  // new optional callbacks
  onMarkerClick?: (marker: AudioMarker) => void;
  onTimeUpdate?: (time: number) => void;
}

const ResearchAudioAnalyzer: React.FC<ResearchAudioAnalyzerProps> = ({
  audioUrl,
  markers = [],
  comments = [],
  loops = [],
  onMarkerCreate,
  onCommentCreate,
  onLoopCreate,
  onLoopUpdate,
  onLoopDelete,
  currentUser,
  width = 800,
  height = 200,
  onMarkerClick,
  onTimeUpdate
}) => {
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [zoom, setZoom] = useState(1);
  
  // UI States
  const [activeTool, setActiveTool] = useState<'cursor' | 'marker' | 'loop' | 'comment'>('cursor');
  const [activeComment, setActiveComment] = useState<{
    timestamp: number;
    type: 'text' | 'voice';
    markerId?: string;
    text?: string;
    isRecording: boolean;
  } | null>(null);

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [activeLoop, setActiveLoop] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const requestRef = useRef<number>();

  // Initialize native HTMLAudioElement
  useEffect(() => {
    try {
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audio.volume = volume;
      audio.playbackRate = playbackRate;

      const onLoaded = () => {
        setDuration(audio.duration || 0);
        setIsLoading(false);
      };
      const onPlay = () => {
        setIsPlaying(true);
        startAnimationFrame();
      };
      const onPause = () => {
        setIsPlaying(false);
        cancelAnimationFrame(requestRef.current!);
      };
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        cancelAnimationFrame(requestRef.current!);
      };
      const onTime = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('timeupdate', onTime);

      soundRef.current = audio;

      return () => {
        audio.pause();
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('timeupdate', onTime);
        // release source
        audio.src = '';
        cancelAnimationFrame(requestRef.current!);
      };
    } catch (err) {
      console.error('Audio initialization error:', err);
      setError('Failed to initialize audio player');
      setIsLoading(false);
    }
  }, [audioUrl]);

  // Animation frame for smooth progress updates
  const startAnimationFrame = useCallback(() => {
    let lastTime = performance.now();
    
    const updateTime = (currentTime: number) => {
      if (!soundRef.current) return;
      
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta > 50) { // Update every 50ms for performance
        const audio = soundRef.current;
        if (!audio) return;
        const seek = audio.currentTime;
        setCurrentTime(seek);

        // notify parent about time updates if provided
        try {
          onTimeUpdate?.(seek);
        } catch (e) {
          // swallow any errors from parent callback
          console.warn('onTimeUpdate callback error:', e);
        }
        
        // Handle active loop
        if (activeLoop) {
          const loop = loops.find(l => l.id === activeLoop);
          if (loop && loop.isActive && seek >= loop.end) {
            soundRef.current.seek(loop.start);
          }
        }
        lastTime = now;
      }
      
      requestRef.current = requestAnimationFrame(updateTime);
    };
    
    requestRef.current = requestAnimationFrame(updateTime);
  }, [activeLoop, loops, onTimeUpdate]);
  
  // Update volume and rate
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    const audio = soundRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      // play returns a promise in some browsers
      void audio.play().catch((e) => console.warn('play failed:', e));
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    const audio = soundRef.current;
    if (!audio) return;
    const safeTime = Math.max(0, Math.min(time, duration));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, [duration]);

  const stopPlayback = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.currentTime = 0;
    }
  }, []);

  // Waveform interaction
  const handleWaveformClick = useCallback((time: number) => {
    switch (activeTool) {
      case 'cursor':
        seekTo(time);
        break;
      case 'marker':
        if (onMarkerCreate) {
          onMarkerCreate({
            timestamp: time,
            label: `Marker at ${formatTime(time)}`,
            color: getRandomColor(),
            description: '',
            category: 'analysis'
          });
        }
        break;
      case 'comment':
        setActiveComment({
          timestamp: time,
          type: 'text',
          isRecording: false
        });
        break;
      case 'loop':
        if (!loopStart) {
          setLoopStart(time);
        } else {
          if (onLoopCreate) {
            const start = Math.min(loopStart, time);
            const end = Math.max(loopStart, time);
            
            onLoopCreate({
              start,
              end,
              label: `Loop ${formatTime(start)}-${formatTime(end)}`,
              color: getRandomColor(),
              isActive: true
            });
          }
          setLoopStart(null);
        }
        break;
    }
  }, [activeTool, seekTo, onMarkerCreate, onLoopCreate, loopStart]);

  // Loop management
  const toggleLoopActive = useCallback((loopId: string) => {
    const loop = loops.find(l => l.id === loopId);
    if (loop && onLoopUpdate) {
      onLoopUpdate(loopId, { isActive: !loop.isActive });
    }
  }, [loops, onLoopUpdate]);

  const playLoop = useCallback((loop: LoopRegion) => {
    seekTo(loop.start);
    if (!isPlaying) {
      togglePlayPause();
    }
    setActiveLoop(loop.id);
  }, [seekTo, isPlaying, togglePlayPause]);

  const clearLoopSelection = useCallback(() => {
    setActiveLoop(null);
    setLoopStart(null);
  }, []);

  // Comment system
  const startVoiceComment = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        if (onCommentCreate) {
          onCommentCreate({
            timestamp: activeComment?.timestamp || currentTime,
            type: 'voice',
            audioBlob,
            text: activeComment?.text,
            markerId: activeComment?.markerId,
            createdBy: currentUser,
            status: 'submitted'
          });
        }

        stream.getTracks().forEach(track => track.stop());
        setActiveComment(null);
      };

      setActiveComment(prev => prev ? { ...prev, isRecording: true } : null);
      mediaRecorder.start();

    } catch (err) {
      console.error('Recording error:', err);
      setError('Microphone access required for voice comments');
    }
  }, [activeComment, currentTime, currentUser, onCommentCreate]);

  const submitTextComment = useCallback((text: string) => {
    if (!text.trim() || !onCommentCreate) return;

    onCommentCreate({
      timestamp: activeComment?.timestamp || currentTime,
      type: 'text',
      text: text.trim(),
      markerId: activeComment?.markerId,
      createdBy: currentUser,
      status: 'submitted'
    });

    setActiveComment(null);
  }, [activeComment, currentTime, currentUser, onCommentCreate]);

  // Utility functions
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomColor = (): string => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleDurationReady = useCallback((audioDuration: number) => {
    setDuration(audioDuration);
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tools:</span>
            {(['cursor', 'marker', 'loop', 'comment'] as const).map(tool => (
              <button
                key={tool}
                onClick={() => {
                  setActiveTool(tool);
                  if (tool !== 'loop') setLoopStart(null);
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                  activeTool === tool
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } ${tool === 'loop' && loopStart ? 'ring-2 ring-blue-500' : ''}`}
              >
                {tool === 'cursor' ? '👆' : 
                 tool === 'marker' ? '📍' : 
                 tool === 'loop' ? '🔁' : '💬'} {tool}
                {tool === 'loop' && loopStart && ` (${formatTime(loopStart)})`}
              </button>
            ))}
            
            {loopStart && (
              <button
                onClick={clearLoopSelection}
                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Cancel Loop
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              disabled={isLoading}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                <option key={speed} value={speed}>{speed}x</option>
              ))}
            </select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(prev => Math.max(0.1, prev / 1.5))}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                −
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(10, prev * 1.5))}
                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Waveform */}
        <div className="mb-6">
          <CanvasWaveform
            audioUrl={audioUrl}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleWaveformClick}
            onWaveformReady={handleDurationReady}
            zoom={zoom}
            width={width}
            height={height}
          />
          
          {/* Time Display */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500 font-mono">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-gray-500 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                isLoading ? 'bg-gray-400' :
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } transition-colors`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={stopPlayback}
              disabled={isLoading || !isPlaying}
              className="w-10 h-10 flex items-center justify-center bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300"
            >
              ⏹
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveComment({
                timestamp: currentTime,
                type: 'text',
                isRecording: false
              })}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              disabled={isLoading}
            >
              💬 Add Comment
            </button>
          </div>
        </div>

        {/* Comment Form */}
        {activeComment && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-blue-900">
                Adding comment at {formatTime(activeComment.timestamp)}
              </span>
            </div>
            
            {activeComment.type === 'text' ? (
              <div className="space-y-3">
                <textarea
                  autoFocus
                  placeholder="Enter your analysis comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  onChange={(e) => setActiveComment(prev => prev ? { ...prev, text: e.target.value } : null)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitTextComment(activeComment.text || '')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Save Comment
                  </button>
                  <button
                    onClick={() => setActiveComment(prev => prev ? { ...prev, type: 'voice' } : null)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    🎤 Switch to Voice
                  </button>
                  <button
                    onClick={() => setActiveComment(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <div className={`w-3 h-3 rounded-full ${activeComment.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">
                    {activeComment.isRecording ? 'Recording...' : 'Ready to record'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={activeComment.isRecording ? () => mediaRecorderRef.current?.stop() : startVoiceComment}
                    className={`px-4 py-2 text-white rounded-lg ${
                      activeComment.isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'
                    }`}
                  >
                    {activeComment.isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
                  </button>
                  <button
                    onClick={() => setActiveComment(prev => prev ? { ...prev, type: 'text' } : null)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    📝 Switch to Text
                  </button>
                  <button
                    onClick={() => setActiveComment(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Markers Panel */}
          <div className="border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900">Analysis Markers ({markers.length})</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    seekTo(marker.timestamp);
                    // notify parent when marker is clicked
                    try {
                      onMarkerClick?.(marker);
                    } catch (e) {
                      console.warn('onMarkerClick callback error:', e);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: marker.color }}
                    />
                    <span className="font-medium text-sm">{marker.label}</span>
                    <span className="text-xs text-gray-500 font-mono ml-auto">
                      {formatTime(marker.timestamp)}
                    </span>
                  </div>
                  {marker.description && (
                    <p className="text-sm text-gray-600">{marker.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Loops Panel */}
          <div className="border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900">Loop Regions ({loops.length})</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loops.map(loop => (
                <div
                  key={loop.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                    activeLoop === loop.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: loop.color }}
                    />
                    <span className="font-medium text-sm flex-1">{loop.label}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatTime(loop.start)} - {formatTime(loop.end)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => playLoop(loop)}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => toggleLoopActive(loop.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        loop.isActive
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {loop.isActive ? 'Active' : 'Inactive'}
                    </button>
                    {onLoopDelete && (
                      <button
                        onClick={() => onLoopDelete(loop.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 ml-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments Panel */}
        <div className="mt-6 border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <h3 className="font-medium text-gray-900">Analysis Comments ({comments.length})</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {comments.map(comment => (
              <div
                key={comment.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                    {comment.type}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">
                    {formatTime(comment.timestamp)}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {comment.createdBy}
                  </span>
                </div>
                
                {comment.type === 'text' ? (
                  <p className="text-gray-700">{comment.text}</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <audio
                      src={comment.audioUrl}
                      controls
                      className="h-8 flex-1"
                    />
                    {comment.text && (
                      <p className="text-sm text-gray-600 flex-1">{comment.text}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchAudioAnalyzer;