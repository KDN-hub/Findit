import { cookies } from 'next/headers';

const SESSION_COOKIE = 'findit_user_id';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session = {
  user: { id: string };
};

export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return { user: { id: userId } };
}

export async function setSessionCookie(userId: number | string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
