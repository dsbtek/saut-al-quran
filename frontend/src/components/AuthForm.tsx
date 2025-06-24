import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthFormProps {
    onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user' as 'user' | 'scholar' | 'admin',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                await login({
                    username: formData.username,
                    password: formData.password,
                });
            } else {
                await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name || undefined,
                    role: formData.role,
                });
            }
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>

            {error && (
                <div
                    style={{
                        color: 'red',
                        backgroundColor: '#ffebee',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Username:</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }}
                    />
                </div>

                {!isLogin && (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Full Name (optional):</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Role:</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginTop: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                <option value="user">
                                    User (Record and receive feedback)
                                </option>
                                <option value="scholar">
                                    Scholar (Review and provide feedback)
                                </option>
                                <option value="admin">
                                    Admin (Manage users and system)
                                </option>
                            </select>
                        </div>
                    </>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '15px' }}
                >
                    {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
                </button>
            </form>

            <p style={{ textAlign: 'center' }}>
                {isLogin
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </p>
        </div>
    );
};

export default AuthForm;
