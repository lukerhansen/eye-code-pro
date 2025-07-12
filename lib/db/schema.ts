import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }), // US state abbreviation (e.g., 'CA', 'NY', 'TX')
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  doctorLimit: integer('doctor_limit').notNull().default(0),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// Billing history for code picker results
export const billingEntries = pgTable('billing_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  insurancePlan: varchar('insurance_plan', { length: 100 }).notNull(),
  doctor: varchar('doctor', { length: 100 }).notNull(),
  patientType: varchar('patient_type', { length: 20 }).notNull(),
  level: integer('level').notNull(),
  recommendedCode: varchar('recommended_code', { length: 20 }).notNull(),
  diagnosis: varchar('diagnosis', { length: 255 }),
  isEmergencyVisit: boolean('is_emergency_visit').notNull().default(false),
  freeExamBilledLastYear: boolean('free_exam_billed_last_year').notNull().default(false),
  flagged: boolean('flagged').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  doctors: many(doctors),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const billingEntriesRelations = relations(billingEntries, ({ one }) => ({
  user: one(users, {
    fields: [billingEntries.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type BillingEntry = typeof billingEntries.$inferSelect;
export type NewBillingEntry = typeof billingEntries.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// Doctors table
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  degree: varchar('degree', { length: 20 }).notNull(), // OD, MD, DO, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Insurance plans master list
export const insurancePlans = pgTable('insurance_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  coversFreeExam: boolean('covers_free_exam').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Doctor insurance acceptance
export const doctorInsurances = pgTable('doctor_insurances', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  insurancePlanId: integer('insurance_plan_id')
    .notNull()
    .references(() => insurancePlans.id),
  isAccepted: boolean('is_accepted').notNull().default(true),
  useCustomFeeSchedule: boolean('use_custom_fee_schedule').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Default fee schedules by insurance and state
export const defaultFeeSchedules = pgTable('default_fee_schedules', {
  id: serial('id').primaryKey(),
  insurancePlanId: integer('insurance_plan_id')
    .notNull()
    .references(() => insurancePlans.id),
  state: varchar('state', { length: 2 }), // US state abbreviation (e.g., 'CA', 'NY', 'TX'), null for global defaults
  code: varchar('code', { length: 20 }).notNull(), // CPT code
  amount: integer('amount').notNull(), // Amount in cents
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Custom fee schedules for specific doctor-insurance combinations
export const customFeeSchedules = pgTable('custom_fee_schedules', {
  id: serial('id').primaryKey(),
  doctorInsuranceId: integer('doctor_insurance_id')
    .notNull()
    .references(() => doctorInsurances.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 20 }).notNull(), // CPT code
  amount: integer('amount').notNull(), // Amount in cents
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations for the new tables
export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  team: one(teams, {
    fields: [doctors.teamId],
    references: [teams.id],
  }),
  doctorInsurances: many(doctorInsurances),
}));

export const insurancePlansRelations = relations(insurancePlans, ({ many }) => ({
  doctorInsurances: many(doctorInsurances),
  defaultFeeSchedules: many(defaultFeeSchedules),
}));

export const doctorInsurancesRelations = relations(doctorInsurances, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [doctorInsurances.doctorId],
    references: [doctors.id],
  }),
  insurancePlan: one(insurancePlans, {
    fields: [doctorInsurances.insurancePlanId],
    references: [insurancePlans.id],
  }),
  customFeeSchedules: many(customFeeSchedules),
}));

export const defaultFeeSchedulesRelations = relations(defaultFeeSchedules, ({ one }) => ({
  insurancePlan: one(insurancePlans, {
    fields: [defaultFeeSchedules.insurancePlanId],
    references: [insurancePlans.id],
  }),
}));

export const customFeeSchedulesRelations = relations(customFeeSchedules, ({ one }) => ({
  doctorInsurance: one(doctorInsurances, {
    fields: [customFeeSchedules.doctorInsuranceId],
    references: [doctorInsurances.id],
  }),
}));


// Export types
export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;
export type InsurancePlan = typeof insurancePlans.$inferSelect;
export type NewInsurancePlan = typeof insurancePlans.$inferInsert;
export type DoctorInsurance = typeof doctorInsurances.$inferSelect;
export type NewDoctorInsurance = typeof doctorInsurances.$inferInsert;
export type DefaultFeeSchedule = typeof defaultFeeSchedules.$inferSelect;
export type NewDefaultFeeSchedule = typeof defaultFeeSchedules.$inferInsert;
export type CustomFeeSchedule = typeof customFeeSchedules.$inferSelect;
export type NewCustomFeeSchedule = typeof customFeeSchedules.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  UPDATE_TEAM_SETTINGS = 'UPDATE_TEAM_SETTINGS',
}
