'use server';

import { setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { signUpSchema, signInSchema } from '@/lib/validations';
import type { ActionResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${API_BASE}/auth`;

export async function signUpAction(
  formData: FormData
): Promise<ActionResponse<{ userId?: number }>> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      location: formData.get('location') as string,
      password: formData.get('password') as string,
    };

    // Validate input
    const validatedFields = signUpSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, email, password } = validatedFields.data; // location is not used by backend register? check backend register endpoint.
    // Backend RegisterRequest: email, password, full_name

    // Check if location is needed? Backend doesn't seem to take location in RegisterRequest model.
    // RegisterRequest(BaseModel): email: EmailStr, password: str, full_name: str

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.detail || 'Registration failed',
        errors: { email: [errorData.detail || 'Registration failed'] }, // Map generic error to email for now
      };
    }

    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}

export async function signInAction(
  formData: FormData
): Promise<ActionResponse<{ access_token: string; user: any }>> {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    // Validate input
    const validatedFields = signInSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: validatedFields.data.email,
        password: validatedFields.data.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.detail || 'Invalid email or password',
        errors: { email: [errorData.detail || 'Invalid email or password'] },
      };
    }

    const data = await response.json();
    await setSessionCookie(data.id);

    return {
      success: true,
      message: 'Signed in successfully!',
      data: {
        access_token: data.access_token,
        user: data,
      },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'Connection failed',
    };
  }
}

/** Call after client-side login (e.g. Google) to set session cookie for server actions. */
export async function setSessionCookieAction(userId: number | string): Promise<void> {
  await setSessionCookie(userId);
}

/** Call on logout to clear session cookie. */
export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
}
