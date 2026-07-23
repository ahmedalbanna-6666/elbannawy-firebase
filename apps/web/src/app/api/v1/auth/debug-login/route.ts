import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = (await request.json()) as Record<string, string>;
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const https = await import('https');
    const qs = 'grant_type=password&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password) + '&key=AIzaSyA3tYGPqgMBW1vvnUHLj18oihxTKLDREyQ';

    const result = await new Promise<{ ok: boolean; data: unknown }>((resolve) => {
      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: '/v1/accounts:signInWithPassword?key=AIzaSyA3tYGPqgMBW1vvnUHLj18oihxTKLDREyQ',
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
