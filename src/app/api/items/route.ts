import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/items${queryString ? `?${queryString}` : ''}`;
    
    // Server-side fetch with ISR caching (revalidate every 60 seconds)
    const res = await fetch(url, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
