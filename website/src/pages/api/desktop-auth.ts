import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the port parameter for desktop app callback
  const { port } = req.query;
  
  // Validate port parameter
  if (port && (isNaN(Number(port)) || Number(port) < 1024 || Number(port) > 65535)) {
    return res.status(400).json({ error: 'Invalid port parameter. Must be between 1024 and 65535.' });
  }

  // Instead of trying to read server-side cookies/localStorage,
  // redirect to a client-side page that can access localStorage
  // and then communicate the UID back
  const redirectUrl = port 
    ? `/desktop-auth/check?port=${encodeURIComponent(port as string)}`
    : '/desktop-auth/check';
    
  return res.redirect(redirectUrl);
}
