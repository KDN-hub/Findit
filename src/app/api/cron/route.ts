import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic'; // Ensure it runs dynamically and isn't statically cached

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return NextResponse.json({ success: res.ok, status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
