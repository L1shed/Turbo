import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    console.error('Auth error:', error);
    return res.redirect(`/auth/error?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/auth/error?error=missing_code');
  }

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError);
      return res.redirect(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`);
    }

    if (!data.session) {
      return res.redirect('/auth/error?error=no_session');
    }

    // Set the session in the response headers for client-side handling
    res.setHeader('Set-Cookie', [
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
    ]);

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Unexpected error during auth callback:', err);
    return res.redirect('/auth/error?error=unexpected_error');
  }
}
