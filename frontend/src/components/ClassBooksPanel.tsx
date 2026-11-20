import React, { useEffect, useState } from 'react';
import { ClassBook } from '../types';
import { apiService } from '../services/api';

interface ClassBooksPanelProps {
    classId: number;
    canManage: boolean;
}

const ClassBooksPanel: React.FC<ClassBooksPanelProps> = ({ classId, canManage }) => {
    const [books, setBooks] = useState<ClassBook[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const [form, setForm] = useState({
        title: '',
        author: '',
        session_name: '2026 Term 1',
        is_free: true,
        price: 0,
        currency: 'NGN',
        external_url: '',
        available_from: '',
        available_until: '',
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadBooks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId]);

    const loadBooks = async () => {
        try {
            setError('');
            const data = await apiService.getClassBooks(classId);
            setBooks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load class books');
        }
    };

    const handleUploadBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            await apiService.uploadClassBook({
                class_id: classId,
                title: form.title,
                author: form.author || undefined,
                session_name: form.session_name,
                is_free: form.is_free,
                price: form.is_free ? 0 : form.price,
                currency: form.currency,
                external_url: form.external_url || undefined,
                available_from: form.available_from || undefined,
                available_until: form.available_until || undefined,
                file: file || undefined,
            });
            setShowAddForm(false);
            setForm({
                title: '',
                author: '',
                session_name: '2026 Term 1',
                is_free: true,
                price: 0,
                currency: 'NGN',
                external_url: '',
                available_from: '',
                available_until: '',
            });
            setFile(null);
            setStatusMsg('Book added to class session!');
            await loadBooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add book');
        }
    };

    const handlePurchase = async (bookId: number) => {
        try {
            setError('');
            const purchase = await apiService.initiateBookPurchase(bookId, 'paystack');
            setStatusMsg(
                `Payment initiated (Ref: ${purchase.transaction_id}). Click "Confirm Payment" to unlock.`,
            );
            await loadBooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate purchase');
        }
    };

    const handleConfirmPurchase = async (purchaseId: number) => {
        try {
            setError('');
            await apiService.confirmBookPurchase(purchaseId);
            setStatusMsg('Payment confirmed! Book unlocked.');
            await loadBooks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to confirm purchase');
        }
    };

    const handleDownload = async (book: ClassBook) => {
        if (!book.file_path && book.external_url) {
            window.open(book.external_url, '_blank', 'noopener,noreferrer');
            return;
        }
        try {
            const blob = await apiService.downloadClassBook(book.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${book.title.replace(/\s+/g, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        }
    };

    return (
        <div className="border-t border-stone-100 pt-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs font-semibold text-emerald-800 hover:underline"
            >
                {isOpen ? '▾ Hide Session Books' : '▸ View Class Session Books'}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3 rounded-xl bg-sand-50 p-3 border border-stone-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                            Session Books &amp; Materials
                        </span>
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                                {showAddForm ? 'Cancel' : '+ Add Book'}
                            </button>
                        )}
                    </div>

                    {statusMsg && <div className="text-xs text-emerald-800 font-medium">{statusMsg}</div>}
                    {error && <div className="text-xs text-red-700">{error}</div>}

                    {showAddForm && (
                        <form onSubmit={handleUploadBook} className="space-y-2 rounded-lg bg-white p-3 border border-stone-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    required
                                    placeholder="Book title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs"
                                />
                                <input
                                    type="text"
                                    placeholder="Author"
                                    value={form.author}
                                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs"
                                />
                                <input
                                    type="text"
                                    required
                                    placeholder="Session (e.g. 2026 Term 1)"
                                    value={form.session_name}
                                    onChange={(e) => setForm({ ...form, session_name: e.target.value })}
                                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs"
                                />
                                <input
                                    type="url"
                                    placeholder="External URL (or upload PDF below)"
                                    value={form.external_url}
                                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                                    className="rounded border border-stone-300 px-2.5 py-1.5 text-xs"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <label className="flex items-center gap-1.5 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={form.is_free}
                                        onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                                    />
                                    Free for session
                                </label>
                                {!form.is_free && (
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Price (NGN)"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                        className="w-28 rounded border border-stone-300 px-2 py-1 text-xs"
                                    />
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.epub,.txt,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="text-xs"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                                Save Book
                            </button>
                        </form>
                    )}

                    {books.length === 0 ? (
                        <p className="text-xs text-stone-500">No books assigned to this class yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {books.map((book) => (
                                <div
                                    key={book.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-stone-200"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-stone-900">{book.title}</span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                    book.is_free
                                                        ? 'bg-emerald-100 text-emerald-900'
                                                        : 'bg-amber-100 text-amber-900'
                                                }`}
                                            >
                                                {book.is_free ? 'Free' : `${book.currency} ${book.price}`}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-stone-500">
                                            Session: {book.session_name}
                                            {book.author ? ` • ${book.author}` : ''}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {book.has_access ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(book)}
                                                className="rounded-lg bg-emerald-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900"
                                            >
                                                📖 Open / Download
                                            </button>
                                        ) : book.purchase_status === 'pending' && book.purchase_id ? (
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmPurchase(book.purchase_id!)}
                                                className="rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-semibold text-stone-950"
                                            >
                                                ✓ Confirm Payment
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handlePurchase(book.id)}
                                                className="rounded-lg bg-stone-900 px-3 py-1 text-[11px] font-semibold text-white"
                                            >
                                                Unlock ({book.currency} {book.price})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClassBooksPanel;
