import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

const isSupabaseConfigured =
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  rawKey.length > 20 &&
  !rawKey.includes('placeholder');

const supabase = isSupabaseConfigured ? createClient(rawUrl, rawKey) : null;

const BOOTSTRAP_ADMINS = (
  process.env.ADMIN_EMAILS || 'xpatagonia.com@gmail.com,admin@xpatagonia.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    uid: string;
    email?: string;
    roleName?: string;
    membershipName?: string;
    [key: string]: any;
  };
}

export async function resolveUserRoleAndMembership(uid: string, email?: string) {
  let roleName = 'vendor';
  let membershipName = 'Basic';

  try {
    const { db } = await import('../db/index.ts');
    const { userRoles, roles, userMemberships, memberships } = await import('../db/schema.ts');
    const { eq } = await import('drizzle-orm');

    const roleRows = await db
      .select()
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, uid));
    if (roleRows[0]?.roles?.name) {
      roleName = roleRows[0].roles.name;
    }

    const memRows = await db
      .select()
      .from(userMemberships)
      .leftJoin(memberships, eq(userMemberships.membershipId, memberships.id))
      .where(eq(userMemberships.userId, uid));
    if (memRows[0]?.memberships?.name) {
      membershipName = memRows[0].memberships.name;
    }
  } catch {
    // DB optional in local preview mode
  }

  if (email && BOOTSTRAP_ADMINS.includes(email.toLowerCase()) && roleName === 'vendor') {
    roleName = 'system_admin';
  }

  return { roleName, membershipName };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  if (!supabase) {
    res.status(503).json({ error: 'Authentication service not configured in this environment' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    const { roleName, membershipName } = await resolveUserRoleAndMembership(user.id, user.email);
    req.user = {
      ...user,
      uid: user.id,
      roleName,
      membershipName,
    };
    next();
  } catch (error) {
    console.error('Error verifying Supabase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const email = (req.user.email || '').toLowerCase();
    const userRole = req.user.roleName || 'vendor';
    const isBootstrapAdmin = BOOTSTRAP_ADMINS.includes(email);

    if (allowedRoles.includes(userRole) || isBootstrapAdmin) {
      next();
      return;
    }

    res.status(403).json({ error: `Forbidden: Requires role ${allowedRoles.join(' or ')}` });
  };
};
