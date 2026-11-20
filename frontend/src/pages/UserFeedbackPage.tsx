import React, { useEffect, useState } from 'react';
import { UserFeedback, UserFeedbackCreate } from '../types';
import { apiService } from '../services/api';

const UserFeedbackPage: React.FC = () => {
    const [history, setHistory] = useState<UserFeedback[]>([]);
    const [form, setForm] = useState<UserFeedbackCreate>({
        feedback_type: 'general',
        title: '',
        description: '',
        priority: 'medium',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        apiService
            .getMyUserFeedback()
            .then(setHistory)
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return;
        setIsSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            const created = await apiService.submitUserFeedback({
                ...form,
                browser_info: navigator.userAgent,
            });
            setHistory([created, ...history]);
            setForm({ feedback_type: 'general', title: '', description: '', priority: 'medium' });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">App Feedback &amp; Bug Reports</h1>
                <p className="text-sm text-stone-600">
                    Help us improve Saut Al-Qur&apos;an by reporting bugs or suggesting new features.
                </p>
            </div>

            {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Thank you! Your feedback has been submitted to our team.
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">Type</label>
                        <select
                            value={form.feedback_type}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    feedback_type: e.target.value as UserFeedbackCreate['feedback_type'],
                                })
                            }
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value="general">General Feedback</option>
                            <option value="bug_report">Bug Report</option>
                            <option value="feature_request">Feature Request</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600">Priority</label>
                        <select
                            value={form.priority}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    priority: e.target.value as UserFeedbackCreate['priority'],
                                })
                            }
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">Title</label>
                    <input
                        type="text"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Short summary"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">Description</label>
                    <textarea
                        rows={4}
                        required
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the issue or idea in detail..."
                        className="w-full rounded-lg border border-stone-300 p-3 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>

            {history.length > 0 && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
                    <h2 className="text-base font-bold text-stone-900">Your Past Submissions</h2>
                    {history.map((item) => (
                        <div key={item.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-stone-900">{item.title}</span>
                                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold capitalize text-stone-700 border border-stone-200">
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserFeedbackPage;
