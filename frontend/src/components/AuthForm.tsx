import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        full_name: '',
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
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    full_name: formData.full_name || undefined,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex rounded-xl bg-stone-100 p-1">
                <button
                    type="button"
                    onClick={() => {
                        setIsLogin(true);
                        setError('');
                    }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${isLogin ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600'
                        }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsLogin(false);
                        setError('');
                    }}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${!isLogin ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600'
                        }`}
                >
                    Create Account
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <>
                        <div>
                            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-stone-700">
                                Email
                            </label>
                            <input
                                id="auth-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="you@example.com"
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="auth-fullname" className="mb-1 block text-sm font-medium text-stone-700">
                                Full Name
                            </label>
                            <input
                                id="auth-fullname"
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Optional"
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label htmlFor="auth-username" className="mb-1 block text-sm font-medium text-stone-700">
                        Username
                    </label>
                    <input
                        id="auth-username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="Enter your username"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                </div>

                <div>
                    <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-stone-700">
                        Password
                    </label>
                    <input
                        id="auth-password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 transition"
                >
                    {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
            </form>

            {isLogin && (
                <div className="mt-5 rounded-xl bg-sand-100 p-3 text-xs text-stone-600">
                    <div className="font-semibold text-stone-700 mb-1">Demo Accounts:</div>
                    <div>Student: <code className="font-mono">testuser</code> / <code className="font-mono">user123</code></div>
                    <div>Scholar: <code className="font-mono">scholar1</code> / <code className="font-mono">scholar123</code></div>
                </div>
            )}
        </div>
    );
};

export default AuthForm;
