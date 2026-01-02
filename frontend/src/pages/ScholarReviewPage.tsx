import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractiveWaveform from '../components/InteractiveWaveform';
import MarkerManager, { Marker, LoopRegion } from '../components/MarkerManager';
import { useRecitationData } from '../hooks/useRecitationData';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useComments } from '../hooks/useComments';
import { useMarkers } from '../hooks/useMarkers';
import { useLoopRegions } from '../hooks/useLoopRegions';
import Header from '../components/Header';
import CommentSection from '../components/CommentSection';
import ReviewControls from '../components/ReviewControls';

interface Recitation {
  id: number;
  user_id: number;
  surah: string;
  ayah_range: string;
  audio_url: string;
  status: 'pending' | 'in_review' | 'reviewed';
  submitted_at: string;
  user: {
    username: string;
    full_name: string;
  };
}

interface Comment {
  id: string;
  timestamp: number;
  endTimestamp?: number;
  text?: string;
  audio_url: string | null; // Change here to allow null
  type: 'text' | 'audio';
  created_at: string;
}

// Custom hook for recitation data
const useRecitation = (recitationId: string) => {
  const [recitation, setRecitation] = useState<Recitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecitation = async () => {
      setIsLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockRecitation: Recitation = {
          id: parseInt(recitationId || '1'),
          user_id: 1,
          surah: 'Al-Fatiha',
          ayah_range: '1-7',
          audio_url: '/api/audio/sample-recitation.mp3',
          status: 'in_review',
          submitted_at: '2024-01-15T10:30:00Z',
          user: { username: 'student123', full_name: 'Ahmad Ali' }
        };
        setRecitation(mockRecitation);
      } catch (error) {
        console.error('Error loading recitation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (recitationId) loadRecitation();
  }, [recitationId]);

  return { recitation, isLoading };
};

const ScholarReviewPage: React.FC = () => {
  const { recitationId } = useParams<{ recitationId: string }>();
  const { recitation, isLoading } = useRecitation(recitationId || '');
  
  // State management
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Custom hooks for different concerns
  const { markers, handleMarkerAdd, handleMarkerUpdate, handleMarkerDelete } = useMarkers();
  const { loopRegions, activeLoopId, handleLoopRegionAdd, handleLoopRegionUpdate, 
          handleLoopRegionDelete, handleLoopToggle } = useLoopRegions();
  const { comments, addComment } = useComments();
  const { isRecording, audioURL: recordedUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    timestamp: 0,
    endTimestamp: 0,
    text: '',
    type: 'text' as const
  });

  // Initialize with mock data
  useEffect(() => {
    if (recitation) {
      // Initialize markers and comments with mock data
      handleMarkerAdd([
        {
          id: '1',
          time: 15.5,
          label: 'Pronunciation Issue',
          description: 'The "ر" sound needs improvement',
          category: 'pronunciation',
          color: '#ef4444'
        },
        {
          id: '2',
          time: 32.2,
          label: 'Good Tajweed',
          description: 'Excellent elongation here',
          category: 'tajweed',
          color: '#10b981'
        }
      ]);

      addComment([
        {
          id: '1',
          timestamp: 15.5,
          text: 'Please pay attention to the pronunciation of "الرحمن". The "ر" should be rolled more clearly.',
          type: 'text',
          created_at: '2024-01-15T11:00:00Z'
        }
      ]);
    }
  }, [recitation, handleMarkerAdd, addComment]);

  const handleSeekTo = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleAddComment = () => {
    const start = Math.min(commentForm.timestamp, commentForm.endTimestamp || commentForm.timestamp);
    const end = Math.max(commentForm.timestamp, commentForm.endTimestamp || commentForm.timestamp);
    
    if (start < 0 || end > duration) {
      alert('Timestamp range is out of bounds.');
      return;
    }
    
    if (commentForm.type === 'text' && !commentForm.text.trim()) {
      alert('Please enter a comment.');
      return;
    }

    if (commentForm.type === 'audio' && !recordedUrl) {
      alert('No audio recorded.');
      return;
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      timestamp: start,
      endTimestamp: end,
      type: commentForm.type,
      created_at: new Date().toISOString(),
      ...(commentForm.type === 'text' 
        ? { text: commentForm.text.trim() }
        : { audio_url: recordedUrl })
    };

    addComment(newComment);
    resetCommentForm();
  };

  const resetCommentForm = () => {
    setCommentForm({
      timestamp: currentTime,
      endTimestamp: currentTime,
      text: '',
      type: 'text'
    });
    clearRecording();
    setShowCommentForm(false);
  };

  const handleSubmitReview = () => {
    // Implementation for submitting review
    console.log('Submitting review...');
  };

  // Sync comment form timestamps when form opens
  useEffect(() => {
    if (showCommentForm) {
      setCommentForm(prev => ({ 
        ...prev, 
        timestamp: currentTime, 
        endTimestamp: currentTime 
      }));
    }
  }, [showCommentForm, currentTime]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!recitation) {
    return <NotFoundState />;
  }

  return (
    <div className="review-container">
      <Header recitation={recitation} />
      
      <div className="review-content">
        {/* Left Column - Waveform and Comments */}
        <div className="left-column">
          <WaveformSection
            audioUrl={recitation.audio_url}
            markers={markers}
            onMarkerAdd={handleMarkerAdd}
            onMarkerClick={handleSeekTo}
            onTimeUpdate={setCurrentTime}
            onDuration={setDuration}
            currentTime={currentTime}
          />
          
          <CommentSection
            comments={comments}
            showCommentForm={showCommentForm}
            commentForm={commentForm}
            duration={duration}
            currentTime={currentTime}
            isRecording={isRecording}
            recordedUrl={recordedUrl}
            onShowCommentForm={setShowCommentForm}
            onCommentFormChange={setCommentForm}
            onAddComment={handleAddComment}
            onCancelComment={resetCommentForm}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onClearRecording={clearRecording}
            onSeekTo={handleSeekTo}
          />
        </div>

        {/* Right Column - Markers and Controls */}
        <div className="right-column">
          <MarkerManager
            markers={markers}
            loopRegions={loopRegions}
            duration={duration}
            currentTime={currentTime}
            onMarkerAdd={handleMarkerAdd}
            onMarkerUpdate={handleMarkerUpdate}
            onMarkerDelete={handleMarkerDelete}
            onLoopRegionAdd={handleLoopRegionAdd}
            onLoopRegionUpdate={handleLoopRegionUpdate}
            onLoopRegionDelete={handleLoopRegionDelete}
            onSeekTo={handleSeekTo}
            onLoopToggle={handleLoopToggle}
          />

          <ReviewControls
            status={recitation.status}
            onSubmitReview={handleSubmitReview}
          />
        </div>
      </div>
    </div>
  );
};

// Extracted components for better organization
const LoadingState: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <p>Loading recitation...</p>
  </div>
);

const NotFoundState: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <p>Recitation not found</p>
    <Link to="/scholar">← Back to Dashboard</Link>
  </div>
);

interface HeaderProps {
  recitation: Recitation;
}

const HeaderComponent: React.FC<HeaderProps> = ({ recitation }) => (
  <div style={{ marginBottom: '20px' }}>
    <Link 
      to="/scholar" 
      className="back-button"
    >
      ← Back to Scholar Dashboard
    </Link>

    <div className="header-card">
      <h1 className="header-title">
        Review Recitation: {recitation.surah} ({recitation.ayah_range})
      </h1>
      <div className="header-details">
        <div>
          <strong>Student:</strong> {recitation.user.full_name} (@{recitation.user.username})
        </div>
        <div>
          <strong>Submitted:</strong> {new Date(recitation.submitted_at).toLocaleDateString()}
        </div>
        <div>
          <strong>Status:</strong> 
          <span className={`status-badge status-${recitation.status}`}>
            {recitation.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  </div>
);

interface WaveformSectionProps {
  audioUrl: string;
  markers: Marker[];
  currentTime: number;
  onMarkerAdd: (marker: Omit<Marker, 'id'>) => void;
  onMarkerClick: (marker: Marker) => void;
  onTimeUpdate: (time: number) => void;
  onDuration: (duration: number) => void;
}

const WaveformSection: React.FC<WaveformSectionProps> = ({
  audioUrl,
  markers,
  onMarkerAdd,
  onMarkerClick,
  onTimeUpdate,
  onDuration,
  currentTime
}) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ marginBottom: '12px' }}>Audio Waveform</h3>
    <InteractiveWaveform
      audioUrl={audioUrl}
      markers={markers}
      onMarkerAdd={onMarkerAdd}
      onMarkerClick={onMarkerClick}
      onTimeUpdate={onTimeUpdate}
      onDuration={onDuration}
      height={150}
    />
  </div>
);

// Add CSS styles (could be moved to a separate CSS file)
const styles = `
.review-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.review-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.back-button {
  display: inline-block;
  padding: 8px 16px;
  background-color: #f8f9fa;
  color: #007bff;
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid #007bff;
  margin-bottom: 16px;
}

.header-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.header-title {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.header-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-reviewed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-in_review {
  background-color: #fef3c7;
  color: #92400e;
}

.status-pending {
  background-color: #f3f4f6;
  color: #374151;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ScholarReviewPage;