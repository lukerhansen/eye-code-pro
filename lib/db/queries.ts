import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  teamMembers,
  teams,
  users,
  billingEntries,
  type NewBillingEntry,
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
    doctorLimit?: number;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

// ---------------- Billing Entries ----------------

export async function logBillingEntry(
  entry: Omit<NewBillingEntry, 'id' | 'userId' | 'createdAt' | 'flagged'> & {
    flagged?: boolean;
  }
) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const newEntry: NewBillingEntry = {
    ...entry,
    userId: user.id,
    flagged: entry.flagged ?? false,
  } as NewBillingEntry;

  const [inserted] = await db
    .insert(billingEntries)
    .values(newEntry)
    .returning({ id: billingEntries.id });

  return inserted?.id;
}

export async function getBillingEntries(limit = 20) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select()
    .from(billingEntries)
    .where(eq(billingEntries.userId, user.id))
    .orderBy(desc(billingEntries.flagged), desc(billingEntries.createdAt))
    .limit(limit);
}

// Flag (or unflag) a billing entry belonging to the current user
export async function flagBillingEntry(entryId: number, flagged = true) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  await db
    .update(billingEntries)
    .set({ flagged })
    .where(and(eq(billingEntries.id, entryId), eq(billingEntries.userId, user.id)));
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}
