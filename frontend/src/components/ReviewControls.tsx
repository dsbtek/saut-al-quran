import React from 'react';

interface ReviewControlsProps {
    onApprove: () => void;
    onReject: () => void;
}

const ReviewControls: React.FC<ReviewControlsProps> = ({ onApprove, onReject }) => {
    return (
        <div className="review-controls">
            <button onClick={onApprove} className="approve-button">
                Approve
            </button>
            <button onClick={onReject} className="reject-button">
                Reject
            </button>
        </div>
    );
};

export default ReviewControls;