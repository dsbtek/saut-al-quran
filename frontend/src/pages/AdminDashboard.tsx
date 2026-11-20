import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            loadUsers();
        }
    }, [user]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, role: User['role']) => {
        try {
            const updated = await apiService.updateUser(userId, { role });
            setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
            setBanner(`Updated ${updated.username} to ${role.replace('_', ' ')}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                <h2 className="text-xl font-bold text-stone-900">Admin Access Required</h2>
                <p className="mt-2 text-sm text-stone-600">
                    Only platform administrators can approve Islamiyya Managers and manage roles.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Platform Administration</h1>
                <p className="text-sm text-stone-600">
                    Approve Islamiyya Managers, promote Scholars, and manage user accounts.
                </p>
            </div>

            {banner && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {banner}
                </div>
            )}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="py-12 text-center text-sm text-stone-500">Loading users...</div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-4 py-3 font-medium text-stone-900">
                                        {u.full_name || u.username}
                                        <div className="text-xs text-stone-400">@{u.username}</div>
                                    </td>
                                    <td className="px-4 py-3 text-stone-600">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={u.role}
                                            onChange={(e) =>
                                                handleRoleChange(u.id, e.target.value as User['role'])
                                            }
                                            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                                        >
                                            <option value="user">Student</option>
                                            <option value="scholar">Scholar</option>
                                            <option value="islamiyya_manager">Islamiyya Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                u.is_active
                                                    ? 'bg-emerald-100 text-emerald-900'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
