import React, { useState } from 'react';
import { CommunityCreate } from '../types';

interface CommunityFormProps {
    onSubmit: (community: CommunityCreate) => void;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: Partial<CommunityCreate>;
}

const CommunityForm: React.FC<CommunityFormProps> = ({
    onSubmit,
    onCancel,
    isLoading = false,
    initialData = {},
}) => {
    const [formData, setFormData] = useState<CommunityCreate>({
        name: initialData.name || '',
        description: initialData.description || '',
        address: initialData.address || '',
        location: initialData.location || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

        if (!formData.name.trim()) {
            newErrors.name = 'Community name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Community name must be at least 3 characters';
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div
            style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
        >
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
                🕌 Create New Community (Islamiyya)
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label
                        htmlFor="name"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                        }}
                    >
                        Community Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Darul Hikmah Islamiyya"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.name ? '#dc3545' : '#ddd'}`,
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.name}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label
                        htmlFor="location"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                        }}
                    >
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Lagos, Nigeria"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label
                        htmlFor="description"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                        }}
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your community's mission and activities..."
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.description ? '#dc3545' : '#ddd'}`,
                            borderRadius: '4px',
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
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {formData.description.length}/500 characters
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label
                        htmlFor="address"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333',
                        }}
                    >
                        Full Address
                    </label>
                    <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Complete address including street, city, state..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical',
                        }}
                        disabled={isLoading}
                    />
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '12px 24px',
                            border: '1px solid #6c757d',
                            backgroundColor: 'transparent',
                            color: '#6c757d',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            border: '1px solid #007bff',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Community'}
                    </button>
                </div>
            </form>

            <div
                style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#0066cc',
                }}
            >
                <strong>Note:</strong> As the creator, you will automatically become an
                admin of this community. You can invite scholars and manage members
                after creation.
            </div>
        </div>
    );
};

export default CommunityForm;
