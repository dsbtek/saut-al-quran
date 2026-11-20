import React, { useEffect, useState } from 'react';
import { Community, CommunityCreate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const CommunitiesPage: React.FC = () => {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState<CommunityCreate>({ name: '', description: '', location: '', address: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const canCreate = user?.role === 'scholar' || user?.role === 'admin';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (search?: string) => {
        try {
            setIsLoading(true);
            setError('');
            const [allList, myList] = await Promise.all([
                apiService.getCommunities(search),
                apiService.getMyCommunities(),
            ]);
            setCommunities(allList);
            setMyCommunities(myList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load communities');
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
            await loadData(searchTerm);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create community');
        }
    };

    const handleJoin = async (id: number) => {
        try {
            await apiService.joinCommunity(id);
            await loadData(searchTerm);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join community');
        }
    };

    const handleLeave = async (id: number) => {
        try {
            await apiService.leaveCommunity(id);
            await loadData(searchTerm);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to leave community');
        }
    };

    const myIds = new Set(myCommunities.map((c) => c.id));
    const displayed = activeTab === 'my' ? myCommunities : communities;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Islamiyya Communities</h1>
                    <p className="text-sm text-stone-600">
                        Connect with local Qur&apos;an learning circles and certified teachers.
                    </p>
                </div>
                {canCreate && (
                    <button
                        type="button"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                    >
                        {showCreateForm ? 'Cancel' : '+ Create Community'}
                    </button>
                )}
            </div>

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
                    <h3 className="text-base font-semibold text-stone-900">New Community</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            required
                            placeholder="Community name"
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
                        placeholder="Description"
                        value={form.description || ''}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="rounded-xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                    >
                        Save Community
                    </button>
                </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-xl border border-stone-200 bg-white p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${activeTab === 'all' ? 'bg-emerald-800 text-white' : 'text-stone-600'
                            }`}
                    >
                        All ({communities.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('my')}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${activeTab === 'my' ? 'bg-emerald-800 text-white' : 'text-stone-600'
                            }`}
                    >
                        My Communities ({myCommunities.length})
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
                <div className="py-12 text-center text-sm text-stone-500">Loading communities...</div>
            ) : displayed.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
                    No communities found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayed.map((c) => {
                        const isMember = myIds.has(c.id);
                        return (
                            <div
                                key={c.id}
                                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-lg font-bold text-stone-900">{c.name}</h3>
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
                                    <div className="text-xs text-stone-500">
                                        {c.member_count !== undefined
                                            ? `${c.member_count} members • ${c.scholar_count || 0} scholars`
                                            : 'Active circle'}
                                    </div>
                                    {isMember ? (
                                        <button
                                            type="button"
                                            onClick={() => handleLeave(c.id)}
                                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                        >
                                            Leave
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleJoin(c.id)}
                                            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                                        >
                                            Join
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
