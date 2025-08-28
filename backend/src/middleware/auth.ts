import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// Verifies Clerk JWTs passed in Authorization: Bearer <token>
export async function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || Array.isArray(authHeader)) {
      console.log('❌ Auth failed: Missing Authorization header');
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const parts = String(authHeader).split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      console.log('❌ Auth failed: Invalid Authorization header format');
      return res.status(401).json({ error: 'Invalid Authorization header format' });
    }
    const token = parts[1];

    if (!process.env.CLERK_SECRET_KEY) {
      console.log('❌ Auth failed: CLERK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify using Clerk Express SDK
    const result = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach userId for downstream usage
    (req as any).userId = result.sub || result.userId || result.sid || null;
    console.log('✅ Auth successful for user:', (req as any).userId);
    return next();
  } catch (err) {
    console.log('❌ Auth failed:', err instanceof Error ? err.message : 'Unknown error');
    return res.status(401).json({ 
      error: 'Token verification failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

