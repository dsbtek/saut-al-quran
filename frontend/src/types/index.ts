export interface User {
    id: number;
    email: string;
    username: string;
    full_name?: string;
    role: 'user' | 'scholar' | 'islamiyya_manager' | 'admin';
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
    scholar?: {
        id: number;
        username: string;
        full_name?: string;
    };
}

export interface Marker {
    id: number;
    recitation_id: number;
    scholar_id?: number;
    timestamp: number;
    label: string;
    description?: string;
    category?: string;
    color?: string;
    created_at: string;
}

export interface LoopRegion {
    id: number;
    recitation_id: number;
    scholar_id?: number;
    start_time: number;
    end_time: number;
    label: string;
    color?: string;
    is_active: boolean;
    created_at: string;
}

export interface RecitationWithDetails extends Recitation {
    user?: User;
    comments?: Comment[];
    markers?: Marker[];
    loop_regions?: LoopRegion[];
}

export interface StudentProgressStats {
    total_recitations: number;
    pending_count: number;
    reviewed_count: number;
    needs_revision_count: number;
    surahs_practiced_count: number;
    surahs_practiced: string[];
    total_comments: number;
    resolved_comments: number;
    unresolved_comments: number;
    total_duration_seconds: number;
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
}

export interface CommunityMembership {
    id: number;
    community_id: number;
    user_id: number;
    role: string;
    requested_role?: string;
    status: 'pending' | 'approved' | 'rejected';
    request_message?: string;
    is_active: boolean;
    joined_at: string;
    user?: User;
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
    memberships?: CommunityMembership[];
}

export type ClassCategory = 'children' | 'adult_male' | 'adult_women' | 'youth' | 'general';

export type IslamicSubject =
    | 'quran_tajweed'
    | 'fiqh'
    | 'aqidah'
    | 'hadith'
    | 'seerah'
    | 'tafsir'
    | 'arabic'
    | 'akhlaq'
    | 'general';

export interface ClassBook {
    id: number;
    class_id: number;
    uploaded_by: number;
    title: string;
    author?: string;
    description?: string;
    session_name: string;
    available_from?: string;
    available_until?: string;
    is_free: boolean;
    price: number;
    currency: string;
    file_path?: string;
    external_url?: string;
    is_active: boolean;
    created_at: string;
    has_access: boolean;
    purchase_status?: 'pending' | 'completed' | 'failed' | null;
    purchase_id?: number | null;
}

export interface BookPurchase {
    id: number;
    book_id: number;
    user_id: number;
    amount: number;
    currency: string;
    payment_provider: string;
    transaction_id: string;
    status: 'pending' | 'completed' | 'failed';
    purchased_at: string;
    completed_at?: string;
}

export interface ClassEnrollment {
    id: number;
    class_id: number;
    student_id: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    student?: {
        id: number;
        username: string;
        full_name?: string;
    };
}

export interface IslamiyyaClass {
    id: number;
    community_id: number;
    scholar_id?: number;
    created_by: number;
    title: string;
    description?: string;
    subject: IslamicSubject;
    category: ClassCategory;
    schedule_days?: string;
    start_time?: string;
    end_time?: string;
    surah_focus?: string;
    max_students?: number;
    is_active: boolean;
    created_at: string;
    scholar?: {
        id: number;
        username: string;
        full_name?: string;
    };
    enrolled_count: number;
    pending_count: number;
    my_enrollment_status?: 'pending' | 'approved' | 'rejected' | null;
    enrollments?: ClassEnrollment[] | null;
}

export interface LectureStreamTarget {
    id?: number;
    lecture_id?: number;
    platform: 'facebook' | 'youtube' | 'instagram' | 'x' | 'custom_rtmp' | string;
    watch_url?: string;
    rtmp_url?: string;
    is_active?: boolean;
}

export interface PublicLecture {
    id: number;
    community_id: number;
    host_id: number;
    title: string;
    speaker_name: string;
    description?: string;
    topic?: string;
    scheduled_at: string;
    status: 'scheduled' | 'live' | 'ended';
    stream_embed_url?: string;
    recording_url?: string;
    is_public: boolean;
    created_at: string;
    community_name?: string;
    stream_targets: LectureStreamTarget[];
}

export interface CommunityCreate {
    name: string;
    description?: string;
    address?: string;
    location?: string;
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

export interface DonationStats {
    total_donations: number;
    total_donors: number;
    monthly_donations: number;
    yearly_donations: number;
    average_donation: number;
    top_donation: number;
    recent_donations: number;
}

export interface PaymentInitiationResponse {
    payment_url: string;
    transaction_id: string;
    reference: string;
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
