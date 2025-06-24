export interface User {
    id: number;
    email: string;
    username: string;
    full_name?: string;
    role: 'user' | 'scholar' | 'admin';
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;
}

export interface Recitation {
    id: number;
    user_id: number;
    surah_name: string;
    ayah_start: number;
    ayah_end: number;
    audio_file_path?: string;
    audio_data?: string;
    duration?: number;
    status: 'pending' | 'reviewed' | 'needs_revision';
    created_at: string;
    updated_at?: string;
}

export interface Comment {
    id: number;
    recitation_id: number;
    scholar_id: number;
    user_id: number;
    timestamp: number;
    text_comment?: string;
    audio_comment_path?: string;
    is_resolved: boolean;
    created_at: string;
    updated_at?: string;
    scholar?: User;
}

export interface Marker {
    id: number;
    recitation_id: number;
    timestamp: number;
    label: string;
    description?: string;
    created_at: string;
}

export interface RecitationWithDetails extends Recitation {
    user?: User;
    comments?: Comment[];
    markers?: Marker[];
}

export interface AuthTokens {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    role?: 'user' | 'scholar' | 'admin';
}
