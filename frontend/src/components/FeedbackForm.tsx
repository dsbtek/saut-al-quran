import React, { useState } from 'react';
import { UserFeedbackCreate } from '../types';

interface FeedbackFormProps {
    onSubmit: (feedback: UserFeedbackCreate) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState<UserFeedbackCreate>({
        feedback_type: 'general',
        title: '',
        description: '',
        priority: 'medium',
        contact_email: '',
        contact_name: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const feedbackTypes = [
        { value: 'bug_report', label: '🐛 Bug Report', description: 'Report a problem or error' },
        { value: 'feature_request', label: '💡 Feature Request', description: 'Suggest a new feature' },
        { value: 'general', label: '💬 General Feedback', description: 'Share your thoughts' },
    ];

    const priorities = [
        { value: 'low', label: 'Low', color: '#28a745' },
        { value: 'medium', label: 'Medium', color: '#ffc107' },
        { value: 'high', label: 'High', color: '#fd7e14' },
        { value: 'critical', label: 'Critical', color: '#dc3545' },
    ];

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
            newErrors.contact_email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Add browser and device info
            const feedbackWithInfo: UserFeedbackCreate = {
                ...formData,
                browser_info: navigator.userAgent,
                device_info: `${navigator.platform} - ${screen.width}x${screen.height}`,
            };
            onSubmit(feedbackWithInfo);
        }
    };

    const selectedType = feedbackTypes.find(type => type.value === formData.feedback_type);

    return (
        <div
            style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '24px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#333', marginBottom: '8px' }}>
                    📝 Share Your Feedback
                </h2>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    Help us improve Saut Al-Qur'an by sharing your thoughts, reporting bugs, or suggesting features
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Feedback Type */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
                        What type of feedback is this?
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {feedbackTypes.map((type) => (
                            <label
                                key={type.value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: `2px solid ${
                                        formData.feedback_type === type.value ? '#007bff' : '#e9ecef'
                                    }`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor:
                                        formData.feedback_type === type.value ? '#e7f3ff' : 'white',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="feedback_type"
                                    value={type.value}
                                    checked={formData.feedback_type === type.value}
                                    onChange={handleChange}
                                    style={{ marginRight: '12px' }}
                                    disabled={isLoading}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {type.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="title" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder={
                            formData.feedback_type === 'bug_report'
                                ? 'e.g., Audio recording not working on mobile'
                                : formData.feedback_type === 'feature_request'
                                ? 'e.g., Add dark mode support'
                                : 'e.g., Great app, love the audio visualization'
                        }
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.title ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.title && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.title}
                        </span>
                    )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder={
                            formData.feedback_type === 'bug_report'
                                ? 'Please describe the bug in detail. What were you doing when it happened? What did you expect to happen?'
                                : formData.feedback_type === 'feature_request'
                                ? 'Describe the feature you would like to see. How would it help you?'
                                : 'Share your thoughts about the app. What do you like? What could be improved?'
                        }
                        rows={6}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.description ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                            resize: 'vertical',
                        }}
                        disabled={isLoading}
                    />
                    {errors.description && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.description}
                        </span>
                    )}
                </div>

                {/* Priority (for bugs and feature requests) */}
                {formData.feedback_type !== 'general' && (
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="priority" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                            }}
                            disabled={isLoading}
                        >
                            {priorities.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                    {priority.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Contact Information */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="contact_name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Your Name (Optional)
                    </label>
                    <input
                        type="text"
                        id="contact_name"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleChange}
                        placeholder="Your name"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="contact_email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Email (Optional)
                    </label>
                    <input
                        type="email"
                        id="contact_email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.contact_email ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.contact_email && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.contact_email}
                        </span>
                    )}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        We'll only use this to follow up on your feedback if needed
                    </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: '1px solid #6c757d',
                                backgroundColor: 'transparent',
                                color: '#6c757d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        style={{
                            flex: 2,
                            padding: '14px',
                            border: 'none',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </div>
            </form>

            <div
                style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0066cc',
                }}
            >
                <strong>Thank you!</strong> Your feedback helps us make Saut Al-Qur'an better for everyone.
                We review all submissions and will implement improvements based on community needs.
            </div>
        </div>
    );
};

export default FeedbackForm;
