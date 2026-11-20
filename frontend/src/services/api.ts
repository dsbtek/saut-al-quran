import {
    User,
    Recitation,
    Comment,
    Marker,
    LoopRegion,
    AuthTokens,
    LoginCredentials,
    RegisterData,
    RecitationWithDetails,
    StudentProgressStats,
    Community,
    CommunityCreate,
    CommunityMembership,
    IslamiyyaClass,
    ClassCategory,
    IslamicSubject,
    ClassBook,
    BookPurchase,
    ClassEnrollment,
    PublicLecture,
    LectureStreamTarget,
    Donation,
    DonationCreate,
    DonationStats,
    PaymentInitiationResponse,
    UserFeedback,
    UserFeedbackCreate,
} from '../types';
import { offlineStorage } from './offlineStorage';

const getApiBaseUrl = () => {
    if (import.meta.env.REACT_APP_API_URL) {
        return import.meta.env.REACT_APP_API_URL;
    }
    if (window.location.port === '3000') {
        return 'http://localhost:8000';
    }
    return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
    private baseURL: string;
    private token: string | null = null;

    constructor() {
        this.baseURL = `${API_BASE_URL}/api/v1`;
        this.token = localStorage.getItem('access_token');
    }

    private getHeaders(includeJson = true): HeadersInit {
        const headers: Record<string, string> = {};
        if (includeJson) {
            headers['Content-Type'] = 'application/json';
        }
        const activeToken = this.token || localStorage.getItem('access_token');
        if (activeToken) {
            headers['Authorization'] = `Bearer ${activeToken}`;
        }
        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        isMultipart = false,
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            ...options,
            headers: {
                ...this.getHeaders(!isMultipart),
                ...(options.headers || {}),
            },
        };

        const response = await fetch(url, config);

        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired. Please sign in again.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.startsWith('audio/') || contentType.includes('octet-stream')) {
            const blob = await response.blob();
            return blob as unknown as T;
        }

        return response.json() as Promise<T>;
    }

    // Auth
    async login(credentials: LoginCredentials): Promise<AuthTokens> {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Invalid username or password');
        }

        const tokens: AuthTokens = await response.json();
        this.token = tokens.access_token;
        localStorage.setItem('access_token', tokens.access_token);
        return tokens;
    }

    async register(userData: RegisterData): Promise<User> {
        return this.request<User>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    logout(): void {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    async getCurrentUser(): Promise<User> {
        return this.request<User>('/users/me');
    }

    // Recitations (multipart primary, offline IndexedDB fallback)
    async uploadRecitation(params: {
        surah_name: string;
        ayah_start: number;
        ayah_end: number;
        audioBlob: Blob;
        duration?: number;
    }): Promise<Recitation & { queuedOffline?: boolean }> {
        if (offlineStorage.isOnline()) {
            try {
                const formData = new FormData();
                formData.append('surah_name', params.surah_name);
                formData.append('ayah_start', String(params.ayah_start));
                formData.append('ayah_end', String(params.ayah_end));
                if (params.duration !== undefined) {
                    formData.append('duration', String(params.duration));
                }
                formData.append('file', params.audioBlob, 'recitation.webm');

                return await this.request<Recitation>(
                    '/recitations/upload',
                    {
                        method: 'POST',
                        body: formData,
                    },
                    true,
                );
            } catch (error) {
                console.warn('Online upload failed, queuing offline:', error);
            }
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(params.audioBlob);
        });

        const pendingId = await offlineStorage.savePendingRecording({
            data: {
                surah_name: params.surah_name,
                ayah_start: params.ayah_start,
                ayah_end: params.ayah_end,
                audio_data: base64Data,
                duration: params.duration,
            },
            token: this.token || localStorage.getItem('access_token') || '',
        });

        await offlineStorage.registerBackgroundSync().catch(() => {});

        return {
            id: parseInt(pendingId, 10) || Date.now(),
            user_id: 0,
            surah_name: params.surah_name,
            ayah_start: params.ayah_start,
            ayah_end: params.ayah_end,
            duration: params.duration,
            status: 'pending',
            created_at: new Date().toISOString(),
            queuedOffline: true,
        };
    }

    async getRecitations(): Promise<Recitation[]> {
        return this.request<Recitation[]>('/recitations/');
    }

    async getRecitation(id: number): Promise<RecitationWithDetails> {
        return this.request<RecitationWithDetails>(`/recitations/${id}`);
    }

    async getPendingRecitations(): Promise<RecitationWithDetails[]> {
        return this.request<RecitationWithDetails[]>('/recitations/pending');
    }

    async getAllScholarRecitations(status?: string): Promise<RecitationWithDetails[]> {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return this.request<RecitationWithDetails[]>(`/recitations/scholar/all${qs}`);
    }

    async updateRecitationStatus(
        id: number,
        status: 'pending' | 'reviewed' | 'needs_revision',
    ): Promise<Recitation> {
        return this.request<Recitation>(`/recitations/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    async getRecitationAudio(id: number): Promise<Blob> {
        return this.request<Blob>(`/recitations/audio/${id}`);
    }

    async getMyProgressStats(): Promise<StudentProgressStats> {
        return this.request<StudentProgressStats>('/recitations/stats/me');
    }

    // Comments
    async createComment(commentData: {
        recitation_id: number;
        timestamp: number;
        text_comment?: string;
    }): Promise<Comment> {
        return this.request<Comment>('/comments/', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    async createCommentWithAudio(params: {
        recitation_id: number;
        timestamp: number;
        text_comment?: string;
        audioBlob?: Blob;
    }): Promise<Comment> {
        const formData = new FormData();
        formData.append('recitation_id', String(params.recitation_id));
        formData.append('timestamp', String(params.timestamp));
        if (params.text_comment) {
            formData.append('text_comment', params.text_comment);
        }
        if (params.audioBlob) {
            formData.append('audio_file', params.audioBlob, 'feedback.webm');
        }
        return this.request<Comment>(
            '/comments/with-audio',
            {
                method: 'POST',
                body: formData,
            },
            true,
        );
    }

    async getCommentAudio(commentId: number): Promise<Blob> {
        return this.request<Blob>(`/comments/audio/${commentId}`);
    }

    async getCommentsForRecitation(recitationId: number): Promise<Comment[]> {
        return this.request<Comment[]>(`/comments/recitation/${recitationId}`);
    }

    async resolveComment(commentId: number, isResolved: boolean): Promise<Comment> {
        return this.request<Comment>(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ is_resolved: isResolved }),
        });
    }

    // Markers & Loop Regions
    async createMarker(markerData: {
        recitation_id: number;
        timestamp: number;
        label: string;
        description?: string;
        category?: string;
        color?: string;
    }): Promise<Marker> {
        return this.request<Marker>('/markers/', {
            method: 'POST',
            body: JSON.stringify(markerData),
        });
    }

    async deleteMarker(markerId: number): Promise<void> {
        await this.request(`/markers/${markerId}`, { method: 'DELETE' });
    }

    async getMarkersForRecitation(recitationId: number): Promise<Marker[]> {
        return this.request<Marker[]>(`/markers/recitation/${recitationId}`);
    }

    async createLoopRegion(loopData: {
        recitation_id: number;
        start_time: number;
        end_time: number;
        label: string;
        color?: string;
    }): Promise<LoopRegion> {
        return this.request<LoopRegion>('/markers/loops/', {
            method: 'POST',
            body: JSON.stringify(loopData),
        });
    }

    async deleteLoopRegion(loopId: number): Promise<void> {
        await this.request(`/markers/loops/${loopId}`, { method: 'DELETE' });
    }

    // Communities & Approvals
    async getCommunities(search?: string): Promise<Community[]> {
        const qs = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.request<Community[]>(`/communities/${qs}`);
    }

    async getMyCommunities(): Promise<Community[]> {
        return this.request<Community[]>('/communities/my-communities');
    }

    async getMyJoinRequests(): Promise<CommunityMembership[]> {
        return this.request<CommunityMembership[]>('/communities/my-requests');
    }

    async getCommunity(id: number): Promise<Community> {
        return this.request<Community>(`/communities/${id}`);
    }

    async createCommunity(data: CommunityCreate): Promise<Community> {
        return this.request<Community>('/communities/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async joinCommunity(
        communityId: number,
        requestedRole: 'member' | 'scholar' = 'member',
        message?: string,
    ): Promise<{ message: string; status: string }> {
        return this.request<{ message: string; status: string }>(`/communities/${communityId}/join`, {
            method: 'POST',
            body: JSON.stringify({
                community_id: communityId,
                requested_role: requestedRole,
                message,
            }),
        });
    }

    async getCommunityRequests(communityId: number): Promise<CommunityMembership[]> {
        return this.request<CommunityMembership[]>(`/communities/${communityId}/requests`);
    }

    async decideCommunityRequest(
        communityId: number,
        membershipId: number,
        decision: 'approve' | 'reject',
    ): Promise<CommunityMembership> {
        return this.request<CommunityMembership>(
            `/communities/${communityId}/requests/${membershipId}/decide`,
            {
                method: 'POST',
                body: JSON.stringify({ decision }),
            },
        );
    }

    async leaveCommunity(communityId: number): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/communities/${communityId}/leave`, {
            method: 'DELETE',
        });
    }

    // Islamiyya Classes
    async getCommunityClasses(communityId: number, category?: ClassCategory): Promise<IslamiyyaClass[]> {
        const qs = category ? `?category=${encodeURIComponent(category)}` : '';
        return this.request<IslamiyyaClass[]>(`/classes/community/${communityId}${qs}`);
    }

    async getMyClasses(): Promise<IslamiyyaClass[]> {
        return this.request<IslamiyyaClass[]>('/classes/my-classes');
    }

    async createClass(data: {
        community_id: number;
        title: string;
        description?: string;
        subject?: IslamicSubject;
        category: ClassCategory;
        schedule_days?: string;
        start_time?: string;
        end_time?: string;
        surah_focus?: string;
    }): Promise<IslamiyyaClass> {
        return this.request<IslamiyyaClass>('/classes/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Class Session Books (Free / Paid)
    async getClassBooks(classId: number): Promise<ClassBook[]> {
        return this.request<ClassBook[]>(`/books/class/${classId}`);
    }

    async uploadClassBook(params: {
        class_id: number;
        title: string;
        session_name: string;
        author?: string;
        description?: string;
        available_from?: string;
        available_until?: string;
        is_free: boolean;
        price?: number;
        currency?: string;
        external_url?: string;
        file?: File;
    }): Promise<ClassBook> {
        const formData = new FormData();
        formData.append('class_id', String(params.class_id));
        formData.append('title', params.title);
        formData.append('session_name', params.session_name);
        if (params.author) formData.append('author', params.author);
        if (params.description) formData.append('description', params.description);
        if (params.available_from) formData.append('available_from', params.available_from);
        if (params.available_until) formData.append('available_until', params.available_until);
        formData.append('is_free', String(params.is_free));
        formData.append('price', String(params.price || 0));
        formData.append('currency', params.currency || 'NGN');
        if (params.external_url) formData.append('external_url', params.external_url);
        if (params.file) formData.append('file', params.file);

        return this.request<ClassBook>(
            '/books/',
            { method: 'POST', body: formData },
            true,
        );
    }

    async initiateBookPurchase(
        bookId: number,
        paymentProvider: 'paystack' | 'stripe' | 'bank_transfer' = 'paystack',
    ): Promise<BookPurchase> {
        return this.request<BookPurchase>(`/books/${bookId}/purchase`, {
            method: 'POST',
            body: JSON.stringify({ payment_provider: paymentProvider }),
        });
    }

    async confirmBookPurchase(purchaseId: number): Promise<BookPurchase> {
        return this.request<BookPurchase>(`/books/purchases/${purchaseId}/confirm`, {
            method: 'POST',
        });
    }

    async downloadClassBook(bookId: number): Promise<Blob> {
        const url = `${this.baseURL}/books/${bookId}/download`;
        const response = await fetch(url, { headers: this.getHeaders(false) });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Failed to download book');
        }
        return response.blob();
    }

    async requestClassEnrollment(classId: number): Promise<ClassEnrollment> {
        return this.request<ClassEnrollment>(`/classes/${classId}/enroll`, {
            method: 'POST',
        });
    }

    async decideClassEnrollment(
        classId: number,
        enrollmentId: number,
        decision: 'approve' | 'reject',
    ): Promise<ClassEnrollment> {
        return this.request<ClassEnrollment>(
            `/classes/${classId}/enrollments/${enrollmentId}/decide`,
            {
                method: 'POST',
                body: JSON.stringify({ decision }),
            },
        );
    }

    // Public Lectures & Social Streaming
    async getLiveLectures(): Promise<PublicLecture[]> {
        return this.request<PublicLecture[]>('/lectures/live');
    }

    async getCommunityLectures(communityId: number): Promise<PublicLecture[]> {
        return this.request<PublicLecture[]>(`/lectures/community/${communityId}`);
    }

    async getLecture(lectureId: number): Promise<PublicLecture> {
        return this.request<PublicLecture>(`/lectures/${lectureId}`);
    }

    async createLecture(data: {
        community_id: number;
        title: string;
        speaker_name: string;
        description?: string;
        topic?: string;
        scheduled_at: string;
        stream_embed_url?: string;
        is_public?: boolean;
        stream_targets: LectureStreamTarget[];
    }): Promise<PublicLecture> {
        return this.request<PublicLecture>('/lectures/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLectureStatus(
        lectureId: number,
        status: 'scheduled' | 'live' | 'ended',
        stream_embed_url?: string,
    ): Promise<PublicLecture> {
        return this.request<PublicLecture>(`/lectures/${lectureId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, stream_embed_url }),
        });
    }

    // Admin Users Management
    async getAllUsers(): Promise<User[]> {
        return this.request<User[]>('/users/');
    }

    async updateUser(
        userId: number,
        data: { role?: User['role']; is_active?: boolean },
    ): Promise<User> {
        return this.request<User>(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Donations
    async initiateDonation(data: DonationCreate): Promise<PaymentInitiationResponse> {
        return this.request<PaymentInitiationResponse>('/donations/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getPublicDonations(): Promise<Donation[]> {
        return this.request<Donation[]>('/donations/public');
    }

    async getDonationStats(): Promise<DonationStats> {
        return this.request<DonationStats>('/donations/stats');
    }

    // User Feedback
    async submitUserFeedback(data: UserFeedbackCreate): Promise<UserFeedback> {
        return this.request<UserFeedback>('/feedback/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMyUserFeedback(): Promise<UserFeedback[]> {
        return this.request<UserFeedback[]>('/feedback/');
    }
}

export const apiService = new ApiService();
