import React, { useEffect, useState } from 'react';
import { Donation, DonationCreate, DonationStats } from '../types';
import { apiService } from '../services/api';

const DonationsPage: React.FC = () => {
    const [stats, setStats] = useState<DonationStats | null>(null);
    const [publicDonations, setPublicDonations] = useState<Donation[]>([]);
    const [form, setForm] = useState<DonationCreate>({
        amount: 5000,
        currency: 'NGN',
        donation_type: 'one_time',
        payment_provider: 'paystack',
        donor_name: '',
        donor_email: '',
        message: '',
        is_anonymous: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMsg, setResultMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([apiService.getDonationStats(), apiService.getPublicDonations()])
            .then(([s, d]) => {
                setStats(s);
                setPublicDonations(d);
            })
            .catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setResultMsg('');
        try {
            const res = await apiService.initiateDonation({
                ...form,
                donor_email: form.donor_email?.trim() || undefined,
            });
            setResultMsg(
                `Donation initiated! Reference: ${res.reference}. Transaction ID: ${res.transaction_id}`,
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate donation');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Support Saut Al-Qur&apos;an</h1>
                <p className="text-sm text-stone-600">
                    Your Sadaqah helps keep scholar reviews free and accessible for students worldwide.
                </p>
            </div>

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="text-xs text-stone-500">Total Raised</div>
                        <div className="mt-1 text-xl font-bold text-emerald-900">
                            ₦{Number(stats.total_donations).toLocaleString()}
                        </div>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="text-xs text-stone-500">Total Donors</div>
                        <div className="mt-1 text-xl font-bold text-stone-900">{stats.total_donors}</div>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="text-xs text-stone-500">This Month</div>
                        <div className="mt-1 text-xl font-bold text-stone-900">
                            ₦{Number(stats.monthly_donations).toLocaleString()}
                        </div>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="text-xs text-stone-500">Last 30 Days</div>
                        <div className="mt-1 text-xl font-bold text-stone-900">
                            {stats.recent_donations} gifts
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4"
                >
                    <h2 className="text-lg font-bold text-stone-900">Make a Contribution</h2>

                    {resultMsg && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                            {resultMsg}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">Amount</label>
                            <input
                                type="number"
                                min="100"
                                required
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">Provider</label>
                            <select
                                value={form.payment_provider}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        payment_provider: e.target.value as DonationCreate['payment_provider'],
                                    })
                                }
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="paystack">Paystack</option>
                                <option value="stripe">Stripe</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={form.donor_name || ''}
                            onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                        <input
                            type="email"
                            placeholder="Email (optional)"
                            value={form.donor_email || ''}
                            onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <textarea
                        rows={2}
                        placeholder="Optional du'a or message..."
                        value={form.message || ''}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />

                    <label className="flex items-center gap-2 text-sm text-stone-700">
                        <input
                            type="checkbox"
                            checked={form.is_anonymous}
                            onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                            className="rounded border-stone-300 text-emerald-800"
                        />
                        Donate anonymously
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : '💝 Initiate Donation'}
                    </button>
                </form>

                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-stone-900">Recent Supporters</h2>
                    {publicDonations.length === 0 ? (
                        <p className="text-sm text-stone-500">Be the first to support this mission.</p>
                    ) : (
                        <div className="space-y-3">
                            {publicDonations.map((d) => (
                                <div key={d.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-stone-900">
                                            {d.donor_name || 'Supporter'}
                                        </span>
                                        <span className="text-sm font-bold text-emerald-800">
                                            {d.currency} {Number(d.amount).toLocaleString()}
                                        </span>
                                    </div>
                                    {d.message && <p className="mt-1 text-xs text-stone-600">{d.message}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonationsPage;
