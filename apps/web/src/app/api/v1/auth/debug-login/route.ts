import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not available in production' } }, { status: 403 });
  }
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: 'Firebase API key not configured' }, { status: 500 });
    }

    const { email, password } = (await request.json()) as Record<string, string>;
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const https = await import('https');
    const qs = 'grant_type=password&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&key=' + API_KEY;

    const result = await new Promise<{ ok: boolean; data: unknown }>((resolve) => {
      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:signInWithPassword?key=' + API_KEY,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ ok: res.statusCode === 200, data: JSON.parse(d) }); }
          catch { resolve({ ok: false, data: d }); }
        });
      });
      req.on('error', (e) => resolve({ ok: false, data: e.message }));
      req.write(qs);
      req.end();
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 });
  }
}
