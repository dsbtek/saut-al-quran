import React, { useState } from 'react';
import type { JSX } from 'react';

const CommentSection: React.FC = () => {
    const [comments, setComments] = useState<string[]>([]);
    const [newComment, setNewComment] = useState<string>('');

    const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewComment(event.target.value);
    };

    const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newComment.trim()) {
            setComments([...comments, newComment]);
            setNewComment('');
        }
    };

    return (
        <div>
            <h2>Comments</h2>
            <form onSubmit={handleCommentSubmit}>
                <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Write a comment..."
                />
                <button type="submit">Add Comment</button>
            </form>
            <ul>
                {comments.map((comment, index) => (
                    <li key={index}>{comment}</li>
                ))}
            </ul>
        </div>
    );
};

export default CommentSection;