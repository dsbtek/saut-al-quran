import React, { useState } from 'react';
import { DonationCreate } from '../types';

interface DonationFormProps {
    onSubmit: (donation: DonationCreate) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

const DonationForm: React.FC<DonationFormProps> = ({
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState<DonationCreate>({
        amount: 0,
        currency: 'NGN',
        donation_type: 'one_time',
        payment_provider: 'paystack',
        donor_name: '',
        donor_email: '',
        message: '',
        is_anonymous: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const predefinedAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleAmountSelect = (amount: number) => {
        setFormData((prev) => ({
            ...prev,
            amount,
        }));
        if (errors.amount) {
            setErrors((prev) => ({
                ...prev,
                amount: '',
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = 'Please enter a valid donation amount';
        } else if (formData.amount < 100) {
            newErrors.amount = 'Minimum donation amount is ₦100';
        }

        if (!formData.donor_email) {
            newErrors.donor_email = 'Email is required for payment processing';
        } else if (!/\S+@\S+\.\S+/.test(formData.donor_email)) {
            newErrors.donor_email = 'Please enter a valid email address';
        }

        if (!formData.donor_name.trim()) {
            newErrors.donor_name = 'Name is required';
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <div
            style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '24px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#333', marginBottom: '8px' }}>
                    💝 Support Saut Al-Qur'an
                </h2>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    Your donation helps us maintain and improve the app for the Muslim community
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Predefined Amounts */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
                        Select Amount
                    </label>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            marginBottom: '12px',
                        }}
                    >
                        {predefinedAmounts.map((amount) => (
                            <button
                                key={amount}
                                type="button"
                                onClick={() => handleAmountSelect(amount)}
                                style={{
                                    padding: '12px',
                                    border: `2px solid ${
                                        formData.amount === amount ? '#007bff' : '#ddd'
                                    }`,
                                    backgroundColor:
                                        formData.amount === amount ? '#e7f3ff' : 'white',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                }}
                            >
                                {formatCurrency(amount)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Amount */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="amount" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Or Enter Custom Amount (₦)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleChange}
                        placeholder="Enter amount"
                        min="100"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.amount ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '16px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.amount && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.amount}
                        </span>
                    )}
                </div>

                {/* Donor Information */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="donor_name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="donor_name"
                        name="donor_name"
                        value={formData.donor_name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.donor_name ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.donor_name && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.donor_name}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="donor_email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Email Address *
                    </label>
                    <input
                        type="email"
                        id="donor_email"
                        name="donor_email"
                        value={formData.donor_email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${errors.donor_email ? '#dc3545' : '#ddd'}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                        }}
                        disabled={isLoading}
                    />
                    {errors.donor_email && (
                        <span style={{ color: '#dc3545', fontSize: '12px' }}>
                            {errors.donor_email}
                        </span>
                    )}
                </div>

                {/* Optional Message */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Message (Optional)
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Leave a message or suggestion..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            resize: 'vertical',
                        }}
                        disabled={isLoading}
                    />
                </div>

                {/* Anonymous Option */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="is_anonymous"
                            checked={formData.is_anonymous}
                            onChange={handleChange}
                            style={{ marginRight: '8px' }}
                            disabled={isLoading}
                        />
                        <span style={{ fontSize: '14px' }}>
                            Make this donation anonymous
                        </span>
                    </label>
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
                            backgroundColor: '#28a745',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                        }}
                        disabled={isLoading || !formData.amount}
                    >
                        {isLoading ? 'Processing...' : `Donate ${formatCurrency(formData.amount)}`}
                    </button>
                </div>
            </form>

            <div
                style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                }}
            >
                🔒 Your payment is secure and processed through trusted payment providers
            </div>
        </div>
    );
};

export default DonationForm;
