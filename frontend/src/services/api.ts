import {
    User,
    Recitation,
    Comment,
    Marker,
    AuthTokens,
    LoginCredentials,
    RegisterData,
    RecitationWithDetails,
} from '../types';
import { offlineStorage } from './offlineStorage';

// Determine API base URL based on how the app is accessed
const getApiBaseUrl = () => {
    // If we have an explicit environment variable, use it
    if (import.meta.env.REACT_APP_API_URL) {
        return import.meta.env.REACT_APP_API_URL;
    }

    // If running on port 3000 (direct Vite), use direct backend
    if (window.location.port === '3000') {
        return 'http://localhost:8000';
    }

    // If running through nginx (port 80 or no port), use relative URL
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

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            headers: this.getHeaders(),
            ...options,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Auth methods
    async login(credentials: LoginCredentials): Promise<AuthTokens> {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const tokens = await response.json();
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

    // User methods
    async getCurrentUser(): Promise<User> {
        return this.request<User>('/users/me');
    }

    // Recitation methods
    async createRecitation(recitationData: {
        surah_name: string;
        ayah_start: number;
        ayah_end: number;
        audio_data?: string;
        duration?: number;
    }): Promise<Recitation> {
        // Try online first
        if (offlineStorage.isOnline()) {
            try {
                return await this.request<Recitation>('/recitations/', {
                    method: 'POST',
                    body: JSON.stringify(recitationData),
                });
            } catch (error) {
                // If online request fails, fall back to offline storage
                console.log('Online request failed, saving offline');
            }
        }

        // Save for offline submission
        const pendingId = await offlineStorage.savePendingRecording({
            data: {
                ...recitationData,
                audio_data: recitationData.audio_data || '',
            },
            token: this.token || '',
        });

        // Register for background sync
        await offlineStorage.registerBackgroundSync();

        // Return a mock recitation object
        return {
            id: parseInt(pendingId),
            user_id: 0,
            surah_name: recitationData.surah_name,
            ayah_start: recitationData.ayah_start,
            ayah_end: recitationData.ayah_end,
            audio_data: recitationData.audio_data,
            duration: recitationData.duration,
            status: 'pending' as const,
            created_at: new Date().toISOString(),
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

    // Comment methods
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

    async getCommentsForRecitation(recitationId: number): Promise<Comment[]> {
        return this.request<Comment[]>(`/comments/recitation/${recitationId}`);
    }

    async getMyComments(): Promise<Comment[]> {
        return this.request<Comment[]>('/comments/my-comments');
    }

    // Marker methods
    async createMarker(markerData: {
        recitation_id: number;
        timestamp: number;
        label: string;
        description?: string;
    }): Promise<Marker> {
        return this.request<Marker>('/markers/', {
            method: 'POST',
            body: JSON.stringify(markerData),
        });
    }

    async getMarkersForRecitation(recitationId: number): Promise<Marker[]> {
        return this.request<Marker[]>(`/markers/recitation/${recitationId}`);
    }
}

export const apiService = new ApiService();
