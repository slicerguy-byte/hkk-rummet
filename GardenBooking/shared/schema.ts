import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  period: integer("period").notNull(), // Derived from weekNumber: 1=Spring(14-23), 2=Summer(24-33), 3=Fall(34-44)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  // Unique constraint: one booking per user per week per year
  uniqueUserWeekYear: sql`UNIQUE (${table.userId}, ${table.weekNumber}, ${table.year})`
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  weekNumber: true,
  year: true,
}).extend({
  year: z.number().optional(), // Will default to current year in storage
});

export const updateBookingSchema = z.object({
  weekNumber: z.number().min(14).max(44).optional(),
  year: z.number().min(new Date().getFullYear() - 1).max(new Date().getFullYear() + 5).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Utility types for frontend
export interface UserWithStats extends User {
  totalBookings: number;
  upcomingBookings: Array<{
    periodName: string;
    weekNumber: number;
    date: string;
  }>;
}

export interface WeekBooking {
  userId: string;
  username: string;
}

export interface PeriodStats {
  id: number;
  name: string;
  totalWeeks: number;
  userBookings: number[];
  availableSlots: number;
}
