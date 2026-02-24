'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { claimItemSchema, messageSchema } from '@/lib/validations';
import type { 
  ActionResponse, 
  Claim, 
  ClaimWithDetails,
  Message,
  MessageWithSender 
} from '@/types';

export async function createClaimAction(
  formData: FormData
): Promise<ActionResponse<{ claimId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in to claim an item',
      };
    }

    const rawData = {
      item_id: formData.get('item_id') as string,
      proof_description: formData.get('proof_description') as string,
    };

    // Validate input
    const validatedFields = claimItemSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { item_id, proof_description } = validatedFields.data;

    // Check if item exists and is claimable
    const items = await query<{ id: string; finder_id: string; status: string }[]>(
      'SELECT id, finder_id, status FROM items WHERE id = ?',
      [item_id]
    );

    if (items.length === 0) {
      return {
        success: false,
        message: 'Item not found',
      };
    }

    const item = items[0];

    if (item.status === 'Claimed') {
      return {
        success: false,
        message: 'This item has already been claimed',
      };
    }

    if (item.finder_id === session.user.id) {
      return {
        success: false,
        message: 'You cannot claim an item you reported',
      };
    }

    // Check if user already has a pending claim for this item
    const existingClaims = await query<Claim[]>(
      'SELECT id FROM claims WHERE item_id = ? AND claimant_id = ? AND status = ?',
      [item_id, session.user.id, 'Pending']
    );

    if (existingClaims.length > 0) {
      return {
        success: false,
        message: 'You already have a pending claim for this item',
      };
    }

    // Create claim
    const id = crypto.randomUUID();

    await query(
      `INSERT INTO claims (id, item_id, claimant_id, status, proof_description) 
       VALUES (?, ?, ?, 'Pending', ?)`,
      [id, item_id, session.user.id, proof_description]
    );

    revalidatePath(`/items/${item_id}`);
    revalidatePath('/my-claims');

    return {
      success: true,
      message: 'Claim submitted successfully! The finder will review your claim.',
      data: { claimId: id },
    };
  } catch (error) {
    console.error('Create claim error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}

export async function updateClaimStatusAction(
  claimId: string,
  status: 'Approved' | 'Rejected'
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in',
      };
    }

    // Get claim and verify ownership
    const claims = await query<(Claim & { finder_id: string })[]>(
      `SELECT c.*, i.finder_id 
       FROM claims c 
       JOIN items i ON c.item_id = i.id 
       WHERE c.id = ?`,
      [claimId]
    );

    if (claims.length === 0) {
      return {
        success: false,
        message: 'Claim not found',
      };
    }

    const claim = claims[0];

    if (claim.finder_id !== session.user.id) {
      return {
        success: false,
        message: 'You are not authorized to update this claim',
      };
    }

    // Update claim status
    await query('UPDATE claims SET status = ? WHERE id = ?', [status, claimId]);

    // If approved, update item status and reject other claims
    if (status === 'Approved') {
      await query('UPDATE items SET status = ? WHERE id = ?', ['Claimed', claim.item_id]);
      await query(
        'UPDATE claims SET status = ? WHERE item_id = ? AND id != ?',
        ['Rejected', claim.item_id, claimId]
      );
    }

    revalidatePath(`/items/${claim.item_id}`);
    revalidatePath('/my-items');
    revalidatePath('/my-claims');

    return {
      success: true,
      message: `Claim ${status.toLowerCase()} successfully`,
    };
  } catch (error) {
    console.error('Update claim status error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}

export async function getClaimsForItemAction(
  itemId: string
): Promise<ActionResponse<ClaimWithDetails[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in',
      };
    }

    // Verify user owns the item
    const items = await query<{ finder_id: string }[]>(
      'SELECT finder_id FROM items WHERE id = ?',
      [itemId]
    );

    if (items.length === 0 || items[0].finder_id !== session.user.id) {
      return {
        success: false,
        message: 'You are not authorized to view these claims',
      };
    }

    const claims = await query<ClaimWithDetails[]>(
      `SELECT c.*, i.title as item_title, i.photo_url as item_photo, u.name as claimant_name 
       FROM claims c 
       JOIN items i ON c.item_id = i.id 
       JOIN users u ON c.claimant_id = u.id 
       WHERE c.item_id = ? 
       ORDER BY c.created_at DESC`,
      [itemId]
    );

    return {
      success: true,
      message: 'Claims fetched successfully',
      data: claims,
    };
  } catch (error) {
    console.error('Get claims error:', error);
    return {
      success: false,
      message: 'Failed to fetch claims',
    };
  }
}

export async function sendMessageAction(
  formData: FormData
): Promise<ActionResponse<{ messageId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in',
      };
    }

    const rawData = {
      claim_id: formData.get('claim_id') as string,
      receiver_id: formData.get('receiver_id') as string,
      content: formData.get('content') as string,
    };

    // Validate input
    const validatedFields = messageSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { claim_id, receiver_id, content } = validatedFields.data;

    // Verify user is part of the claim conversation
    const claims = await query<(Claim & { finder_id: string })[]>(
      `SELECT c.*, i.finder_id 
       FROM claims c 
       JOIN items i ON c.item_id = i.id 
       WHERE c.id = ?`,
      [claim_id]
    );

    if (claims.length === 0) {
      return {
        success: false,
        message: 'Claim not found',
      };
    }

    const claim = claims[0];
    const isClaimant = claim.claimant_id === session.user.id;
    const isFinder = claim.finder_id === session.user.id;

    if (!isClaimant && !isFinder) {
      return {
        success: false,
        message: 'You are not authorized to send messages in this conversation',
      };
    }

    // Create message
    const id = crypto.randomUUID();

    await query(
      `INSERT INTO messages (id, claim_id, sender_id, receiver_id, content) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, claim_id, session.user.id, receiver_id, content]
    );

    revalidatePath(`/messages/claim/${claim_id}`);

    return {
      success: true,
      message: 'Message sent',
      data: { messageId: id },
    };
  } catch (error) {
    console.error('Send message error:', error);
    return {
      success: false,
      message: 'Failed to send message',
    };
  }
}

export async function getMessagesAction(
  claimId: string
): Promise<ActionResponse<MessageWithSender[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in',
      };
    }

    // Verify user is part of the conversation
    const claims = await query<(Claim & { finder_id: string })[]>(
      `SELECT c.*, i.finder_id 
       FROM claims c 
       JOIN items i ON c.item_id = i.id 
       WHERE c.id = ?`,
      [claimId]
    );

    if (claims.length === 0) {
      return {
        success: false,
        message: 'Claim not found',
      };
    }

    const claim = claims[0];
    const isClaimant = claim.claimant_id === session.user.id;
    const isFinder = claim.finder_id === session.user.id;

    if (!isClaimant && !isFinder) {
      return {
        success: false,
        message: 'You are not authorized to view these messages',
      };
    }

    // Get messages
    const messages = await query<MessageWithSender[]>(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.claim_id = ? 
       ORDER BY m.created_at ASC`,
      [claimId]
    );

    // Mark messages as read
    await query(
      'UPDATE messages SET is_read = TRUE WHERE claim_id = ? AND receiver_id = ?',
      [claimId, session.user.id]
    );

    return {
      success: true,
      message: 'Messages fetched successfully',
      data: messages,
    };
  } catch (error) {
    console.error('Get messages error:', error);
    return {
      success: false,
      message: 'Failed to fetch messages',
    };
  }
}
