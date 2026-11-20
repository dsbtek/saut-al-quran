import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Community, CommunityCreate, CommunityMembership } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const CommunitiesPage: React.FC = () => {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [myRequests, setMyRequests] = useState<CommunityMembership[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState<CommunityCreate>({ name: '', description: '', location: '', address: '' });
    const [joinModalId, setJoinModalId] = useState<number | null>(null);
    const [joinRole, setJoinRole] = useState<'member' | 'scholar'>('member');
    const [joinMsg, setJoinMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [statusBanner, setStatusBanner] = useState('');
    const [error, setError] = useState('');

    const canCreate = user?.role === 'islamiyya_manager' || user?.role === 'admin';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (search?: string) => {
        try {
            setIsLoading(true);
            setError('');
            const [allList, myList, reqList] = await Promise.all([
                apiService.getCommunities(search),
                apiService.getMyCommunities(),
                apiService.getMyJoinRequests(),
            ]);
            setCommunities(allList);
            setMyCommunities(myList);
            setMyRequests(reqList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load Islamiyyas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            await apiService.createCommunity(form);
            setForm({ name: '', description: '', location: '', address: '' });
            setShowCreateForm(false);
            setStatusBanner('Islamiyya created successfully!');
            await loadData(searchTerm);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create Islamiyya');
        }
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinModalId) return;
        try {
            const res = await apiService.joinCommunity(joinModalId, joinRole, joinMsg);
            setStatusBanner(res.message);
            setJoinModalId(null);
            setJoinMsg('');
            await loadData(searchTerm);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit join request');
        }
    };

    const myIds = new Set(myCommunities.map((c) => c.id));
    const requestByCommunity = new Map(myRequests.map((r) => [r.community_id, r]));
    const displayed = activeTab === 'my' ? myCommunities : communities;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Islamiyya Communities</h1>
                    <p className="text-sm text-stone-600">
                        Browse Islamiyya centers, request to join as a student or scholar, and attend classes &amp; lectures.
                    </p>
                </div>
                {canCreate && (
                    <button
                        type="button"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                    >
                        {showCreateForm ? 'Cancel' : '+ Create Islamiyya'}
                    </button>
                )}
            </div>

            {statusBanner && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {statusBanner}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {showCreateForm && (
                <form
                    onSubmit={handleCreate}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
                >
                    <h3 className="text-base font-semibold text-stone-900">Register New Islamiyya</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            required
                            placeholder="Islamiyya name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                        <input
                            type="text"
                            placeholder="City / Location"
                            value={form.location || ''}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <textarea
                        rows={2}
                        placeholder="Description & curriculum focus"
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                    >
                        Save Islamiyya
                    </button>
                </form>
            )}

            {joinModalId && (
                <form
                    onSubmit={handleJoinSubmit}
                    className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm space-y-3"
                >
                    <h3 className="text-base font-semibold text-stone-900">Request to Join Islamiyya</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                                Requesting as
                            </label>
                            <select
                                value={joinRole}
                                onChange={(e) => setJoinRole(e.target.value as 'member' | 'scholar')}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                            >
                                <option value="member">Student</option>
                                <option value="scholar">Scholar / Teacher</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                                Note for Manager (optional)
                            </label>
                            <input
                                type="text"
                                value={joinMsg}
                                onChange={(e) => setJoinMsg(e.target.value)}
                                placeholder="Assalamu Alaikum, I would like to join..."
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                        >
                            Send Request
                        </button>
                        <button
                            type="button"
                            onClick={() => setJoinModalId(null)}
                            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-xl border border-stone-200 bg-white p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                            activeTab === 'all' ? 'bg-emerald-800 text-white' : 'text-stone-600'
                        }`}
                    >
                        All Islamiyyas ({communities.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('my')}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                            activeTab === 'my' ? 'bg-emerald-800 text-white' : 'text-stone-600'
                        }`}
                    >
                        My Islamiyyas ({myCommunities.length})
                    </button>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        loadData(searchTerm);
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name or city..."
                        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm"
                    />
                    <button
                        type="submit"
                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                        Search
                    </button>
                </form>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-sm text-stone-500">Loading Islamiyyas...</div>
            ) : displayed.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
                    No Islamiyyas found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayed.map((c) => {
                        const isMember = myIds.has(c.id);
                        const req = requestByCommunity.get(c.id);
                        const isPending = !isMember && req?.status === 'pending';

                        return (
                            <div
                                key={c.id}
                                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-500 transition"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <Link
                                            to={`/communities/${c.id}`}
                                            className="text-lg font-bold text-stone-900 hover:text-emerald-800"
                                        >
                                            {c.name}
                                        </Link>
                                        {c.location && (
                                            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                                                {c.location}
                                            </span>
                                        )}
                                    </div>
                                    {c.description && (
                                        <p className="mt-2 text-sm text-stone-600">{c.description}</p>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                                    <Link
                                        to={`/communities/${c.id}`}
                                        className="text-xs font-semibold text-emerald-800 hover:underline"
                                    >
                                        View Classes &amp; Lectures →
                                    </Link>
                                    {isMember ? (
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                                            ✓ Member
                                        </span>
                                    ) : isPending ? (
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                            ⏳ Pending ({req?.requested_role})
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setJoinModalId(c.id)}
                                            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                                        >
                                            Request to Join
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CommunitiesPage;
