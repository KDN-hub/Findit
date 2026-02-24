import { API_BASE_URL } from '@/lib/config';

const API_URL = API_BASE_URL;

export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    item_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: number;
    conversation_id: string; // format: item_id-other_user_id (legacy?) or just kept for compatibility
    item_id: number;
    item_title: string;
    other_user_id: number;
    other_user_name: string;
    other_user_avatar?: string;
    last_message: string;
    is_read: boolean;
    created_at: string;
}

async function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

export async function getConversations(): Promise<Conversation[]> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/messages/conversations`, { headers });
        if (!res.ok) throw new Error('Failed to fetch conversations');
        return res.json();
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

export interface UserTiny {
    id: number;
    email: string;
    name: string;
    avatar_url?: string;
}

export interface ConversationDetail {
    id: number;
    item: {
        id: number;
        title: string;
        image_url?: string;
        status: string;
        owner_id?: number;
    };
    other_user: UserTiny;
    is_finder: boolean;  // True if current user is the finder (item owner)
}

export async function getConversationDetail(conversationId: number): Promise<ConversationDetail | null> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/conversations/${conversationId}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch conversation details');
        return res.json();
    } catch (error) {
        console.error('Error fetching conversation detail:', error);
        return null;
    }
}

export async function getMessages(conversationId: number): Promise<ChatMessage[]> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, { headers });
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

export async function sendMessage(itemId: number, receiverId: number, content: string): Promise<ChatMessage | null> {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                item_id: itemId,
                receiver_id: receiverId,
                content,
            }),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed to send message');
        }
        return res.json();
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}
