import { db } from './index.ts';
import { users, userRoles, roles, memberships, userMemberships, companyProfiles } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  const result = await db.insert(users)
    .values({
      uid,
      email,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
      },
    })
    .returning();
  return result[0];
}

export async function registerUserSetup(uid: string, email: string, cuit: string, category: string) {
  const result = await db.insert(users)
    .values({ uid, email, cuit, category })
    .onConflictDoUpdate({ target: users.uid, set: { email, cuit, category } })
    .returning();
  const user = result[0];

  let roleRes = await db.select().from(roles).where(eq(roles.name, 'vendor'));
  if (roleRes.length === 0) {
    roleRes = await db.insert(roles).values({ name: 'vendor', description: 'Proveedor' }).returning();
  }
  const roleId = roleRes[0].id;
  
  const userRoleRes = await db.select().from(userRoles).where(eq(userRoles.userId, uid));
  if (userRoleRes.length === 0) {
     await db.insert(userRoles).values({ userId: uid, roleId });
  }

  let memRes = await db.select().from(memberships).where(eq(memberships.name, 'Basic'));
  if (memRes.length === 0) {
    memRes = await db.insert(memberships).values({ name: 'Basic', tier: 1, price: 0, maxProducts: 10, maxRfqsMonthly: 3, aiAccessLevel: 'standard' }).returning();
  }
  const memId = memRes[0].id;

  const userMemRes = await db.select().from(userMemberships).where(eq(userMemberships.userId, uid));
  if (userMemRes.length === 0) {
     await db.insert(userMemberships).values({ userId: uid, membershipId: memId, status: 'active' });
  }

  const companyRes = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, uid));
  if (companyRes.length === 0) {
     await db.insert(companyProfiles).values({ userId: uid, email: email, cuit: cuit, industry: category, companyName: '' });
  }

  return user;
}
