'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';
import { reportItemSchema, filterSchema } from '@/lib/validations';
import type { 
  ActionResponse, 
  Item, 
  ItemWithFinder, 
  PaginatedResponse,
  ItemFilters 
} from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Helper function to save uploaded image
async function saveImage(file: File): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = file.name.split('.').pop();
    const filename = `${uniqueSuffix}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
}

export async function reportItemAction(
  formData: FormData
): Promise<ActionResponse<{ itemId: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'You must be signed in to report an item',
      };
    }

    const rawData = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
    };

    // Validate input
    const validatedFields = reportItemSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { title, category, location, description } = validatedFields.data;

    // Handle image upload
    let photo_url: string | null = null;
    const photo = formData.get('photo') as File | null;
    
    if (photo && photo.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(photo.type)) {
        return {
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
          errors: { photo: ['Invalid file type'] },
        };
      }

      // Validate file size (5MB max)
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
      if (photo.size > maxSize) {
        return {
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          errors: { photo: ['File too large'] },
        };
      }

      photo_url = await saveImage(photo);
    }

    // Generate UUID
    const id = crypto.randomUUID();

    // Insert item
    await query(
      `INSERT INTO items (id, finder_id, title, category, location, description, photo_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Found')`,
      [id, session.user.id, title, category, location, description, photo_url]
    );

    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      message: 'Item reported successfully!',
      data: { itemId: id },
    };
  } catch (error) {
    console.error('Report item error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}

export async function getItemsAction(
  filters: ItemFilters
): Promise<ActionResponse<PaginatedResponse<ItemWithFinder>>> {
  try {
    // Validate filters
    const validatedFilters = filterSchema.safeParse(filters);
    
    if (!validatedFilters.success) {
      return {
        success: false,
        message: 'Invalid filters',
      };
    }

    const { search, category, location, status, page, limit } = validatedFilters.data;
    const offset = (page - 1) * limit;

    // Build query dynamically
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      whereClause += ' AND (MATCH(i.title, i.description) AGAINST(? IN NATURAL LANGUAGE MODE) OR i.title LIKE ? OR i.description LIKE ?)';
      params.push(search, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND i.category = ?';
      params.push(category);
    }

    if (location) {
      whereClause += ' AND i.location LIKE ?';
      params.push(`%${location}%`);
    }

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) as total FROM items i ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get paginated items
    const items = await query<ItemWithFinder[]>(
      `SELECT i.*, u.name as finder_name, u.avatar_url as finder_avatar 
       FROM items i 
       JOIN users u ON i.finder_id = u.id 
       ${whereClause} 
       ORDER BY i.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      success: true,
      message: 'Items fetched successfully',
      data: {
        data: items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Get items error:', error);
    return {
      success: false,
      message: 'Failed to fetch items',
    };
  }
}

export async function getItemByIdAction(
  id: string
): Promise<ActionResponse<ItemWithFinder>> {
  try {
    const items = await query<ItemWithFinder[]>(
      `SELECT i.*, u.name as finder_name, u.avatar_url as finder_avatar 
       FROM items i 
       JOIN users u ON i.finder_id = u.id 
       WHERE i.id = ?`,
      [id]
    );

    if (items.length === 0) {
      return {
        success: false,
        message: 'Item not found',
      };
    }

    return {
      success: true,
      message: 'Item fetched successfully',
      data: items[0],
    };
  } catch (error) {
    console.error('Get item error:', error);
    return {
      success: false,
      message: 'Failed to fetch item',
    };
  }
}
