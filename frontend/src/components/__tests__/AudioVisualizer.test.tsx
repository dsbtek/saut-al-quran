import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AudioVisualizer from '../AudioVisualizer';

// Mock AudioContext and related APIs
const mockAudioContext = {
    createAnalyser: vi.fn(() => ({
        fftSize: 256,
        smoothingTimeConstant: 0.8,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
    })),
    createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
    })),
    close: vi.fn(),
    state: 'running',
};

const mockCanvas = {
    getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
        })),
        font: '',
        textAlign: '',
        fillText: vi.fn(),
    })),
    width: 400,
    height: 100,
};

// Mock global APIs
Object.defineProperty(window, 'AudioContext', {
    writable: true,
    value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
    writable: true,
    value: vi.fn(() => mockAudioContext),
});

global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;

describe('AudioVisualizer', () => {
    const mockStream = {
        getTracks: vi.fn(() => []),
    } as unknown as MediaStream;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders canvas element', () => {
        render(<AudioVisualizer stream={null} isRecording={false} />);

        const canvas = screen.getByRole('img', { hidden: true }); // Canvas has img role
        expect(canvas).toBeInTheDocument();
    });

    it('displays ready message when not recording', () => {
        render(<AudioVisualizer stream={null} isRecording={false} />);

        expect(screen.getByText('Audio visualizer ready')).toBeInTheDocument();
    });

    it('displays recording message when recording', () => {
        render(<AudioVisualizer stream={mockStream} isRecording={true} />);

        expect(
            screen.getByText(/Recording - Speak clearly/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Red line shows rhythm intensity/),
        ).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
        render(
            <AudioVisualizer
                stream={null}
                isRecording={false}
                width={600}
                height={150}
            />,
        );

        const canvas = screen.getByRole('img', { hidden: true });
        expect(canvas).toHaveAttribute('width', '600');
        expect(canvas).toHaveAttribute('height', '150');
    });

    it('applies custom styling props', () => {
        render(
            <AudioVisualizer
                stream={null}
                isRecording={false}
                color="#ff0000"
                backgroundColor="#000000"
                barCount={64}
            />,
        );

        // Component should render without errors with custom props
        expect(screen.getByText('Audio visualizer ready')).toBeInTheDocument();
    });

    it('creates audio context when stream is provided and recording', () => {
        render(<AudioVisualizer stream={mockStream} isRecording={true} />);

        // AudioContext should be created when recording starts
        expect(window.AudioContext).toHaveBeenCalled();
    });

    it('handles missing stream gracefully', () => {
        render(<AudioVisualizer stream={null} isRecording={true} />);

        // Should not crash and should show ready state
        expect(screen.getByText('Audio visualizer ready')).toBeInTheDocument();
    });

    it('cleans up resources when unmounted', () => {
        const { unmount } = render(
            <AudioVisualizer stream={mockStream} isRecording={true} />,
        );

        unmount();

        // Should call cleanup functions
        expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('shows recording indicator when recording is active', () => {
        render(<AudioVisualizer stream={mockStream} isRecording={true} />);

        const recordingIndicator = screen.getByText(/🔴 Recording/);
        expect(recordingIndicator).toBeInTheDocument();
        expect(recordingIndicator).toHaveStyle({
            color: '#ff4444',
            fontWeight: 'bold',
        });
    });

    it('renders with default props', () => {
        render(<AudioVisualizer stream={null} isRecording={false} />);

        const canvas = screen.getByRole('img', { hidden: true });
        expect(canvas).toHaveAttribute('width', '400');
        expect(canvas).toHaveAttribute('height', '100');
    });

    it('handles audio context creation errors', () => {
        // Mock AudioContext to throw an error
        const originalAudioContext = window.AudioContext;
        window.AudioContext = vi.fn(() => {
            throw new Error('AudioContext not supported');
        });

        const consoleSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        render(<AudioVisualizer stream={mockStream} isRecording={true} />);

        expect(consoleSpy).toHaveBeenCalledWith(
            'Error setting up audio analysis:',
            expect.any(Error),
        );

        // Restore original AudioContext
        window.AudioContext = originalAudioContext;
        consoleSpy.mockRestore();
    });

    it('stops recording visualization when isRecording becomes false', () => {
        const { rerender } = render(
            <AudioVisualizer stream={mockStream} isRecording={true} />,
        );

        expect(screen.getByText(/🔴 Recording/)).toBeInTheDocument();

        rerender(<AudioVisualizer stream={mockStream} isRecording={false} />);

        expect(screen.getByText('Audio visualizer ready')).toBeInTheDocument();
        expect(screen.queryByText(/🔴 Recording/)).not.toBeInTheDocument();
    });
});
