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

export interface Community {
    id: number;
    name: string;
    description?: string;
    address?: string;
    location?: string;
    is_active: boolean;
    created_by: number;
    created_at: string;
    updated_at?: string;
    creator?: User;
    member_count?: number;
    scholar_count?: number;
    members?: User[];
}

export interface CommunityMembership {
    id: number;
    community_id: number;
    user_id: number;
    role: string;
    is_active: boolean;
    joined_at: string;
    left_at?: string;
    user?: User;
    community?: Community;
}

export interface CommunityCreate {
    name: string;
    description?: string;
    address?: string;
    location?: string;
}

export interface CommunityJoinRequest {
    community_id: number;
    message?: string;
}

export interface Donation {
    id: number;
    user_id?: number;
    amount: number;
    currency: string;
    donation_type: 'one_time' | 'recurring';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_provider: 'paystack' | 'stripe' | 'bank_transfer';
    transaction_id: string;
    payment_reference?: string;
    donor_name?: string;
    donor_email?: string;
    message?: string;
    is_anonymous: boolean;
    created_at: string;
    completed_at?: string;
}

export interface DonationCreate {
    amount: number;
    currency?: string;
    donation_type?: 'one_time' | 'recurring';
    payment_provider: 'paystack' | 'stripe' | 'bank_transfer';
    donor_name?: string;
    donor_email?: string;
    message?: string;
    is_anonymous?: boolean;
    recurring_interval?: string;
}

export interface UserFeedback {
    id: number;
    user_id?: number;
    feedback_type: 'bug_report' | 'feature_request' | 'general';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    contact_email?: string;
    contact_name?: string;
    admin_response?: string;
    created_at: string;
    resolved_at?: string;
}

export interface UserFeedbackCreate {
    feedback_type: 'bug_report' | 'feature_request' | 'general';
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    contact_email?: string;
    contact_name?: string;
    browser_info?: string;
    device_info?: string;
}
