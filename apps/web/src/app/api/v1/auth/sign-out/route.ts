import { NextResponse } from 'next/server';

export function POST(): NextResponse {
  const response = NextResponse.json({ success: true });

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
