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

    // Communities
    async getCommunities(search?: string): Promise<Community[]> {
        const qs = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.request<Community[]>(`/communities/${qs}`);
    }

    async getMyCommunities(): Promise<Community[]> {
        return this.request<Community[]>('/communities/my-communities');
    }

    async createCommunity(data: CommunityCreate): Promise<Community> {
        return this.request<Community>('/communities/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async joinCommunity(communityId: number, message?: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/communities/${communityId}/join`, {
            method: 'POST',
            body: JSON.stringify({ community_id: communityId, message }),
        });
    }

    async leaveCommunity(communityId: number): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/communities/${communityId}/leave`, {
            method: 'DELETE',
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
