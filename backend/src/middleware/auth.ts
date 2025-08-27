import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';

// Verifies Clerk JWTs passed in Authorization: Bearer <token>
export async function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || Array.isArray(authHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parts = String(authHeader).split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = parts[1];

    // Verify using Clerk SDK; requires CLERK_SECRET_KEY in env.
    // verifyToken returns claims on success, throws on failure
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach userId for downstream usage
    (req as any).userId = claims.sub || claims.userId || claims.sid || null;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

