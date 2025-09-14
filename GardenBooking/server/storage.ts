import { type User, type InsertUser, type Booking, type InsertBooking, type UserWithStats, type WeekBooking, type PeriodStats, updateBookingSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";

type UpdateBooking = z.infer<typeof updateBookingSchema>;

// Storage interface for users and bookings
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;
  
  // Booking methods
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string, year?: number): Promise<Booking[]>;
  getBookingsByWeek(weekNumber: number, year?: number): Promise<Booking[]>;
  getBookingsByPeriod(period: number, year?: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: UpdateBooking): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  deleteBookingByUserAndWeek(userId: string, weekNumber: number, year?: number): Promise<boolean>;
  
  // Statistics and aggregated data
  getPeriodStats(userId?: string, year?: number): Promise<PeriodStats[]>;
  getWeekBookings(weekNumber: number, year?: number): Promise<WeekBooking[]>;
  getAllUsers(): Promise<User[]>;
  getAllBookings(year?: number): Promise<Booking[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bookings: Map<string, Booking>;
  private currentYear: number;

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.currentYear = new Date().getFullYear();
    
    // TODO: Remove default admin user in production - security risk
    // Add default admin user for development only
    if (process.env.NODE_ENV === 'development') {
      this.createDevAdminUser();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const userBookings = Array.from(this.bookings.values())
      .filter(b => b.userId === id && b.year === this.currentYear);
    
    const upcomingBookings = userBookings
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .slice(0, 3)
      .map(booking => ({
        periodName: this.getPeriodName(booking.period),
        weekNumber: booking.weekNumber,
        date: this.getWeekDateRange(booking.weekNumber)
      }));
    
    return {
      ...user,
      totalBookings: userBookings.length,
      upcomingBookings
    };
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByUser(userId: string, year = this.currentYear): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.userId === userId && b.year === year);
  }

  async getBookingsByWeek(weekNumber: number, year = this.currentYear): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.weekNumber === weekNumber && b.year === year);
  }

  async getBookingsByPeriod(period: number, year = this.currentYear): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.period === period && b.year === year);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const year = insertBooking.year ?? this.currentYear;
    const weekNumber = insertBooking.weekNumber;
    const period = this.derivePeriodFromWeek(weekNumber);
    
    // Validate week number
    if (weekNumber < 14 || weekNumber > 44) {
      throw new Error(`Invalid week number: ${weekNumber}. Must be between 14-44`);
    }
    
    // Check for duplicate booking
    const existingBooking = Array.from(this.bookings.values())
      .find(b => b.userId === insertBooking.userId && b.weekNumber === weekNumber && b.year === year);
    
    if (existingBooking) {
      throw new Error(`User already has a booking for week ${weekNumber} in ${year}`);
    }
    
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      year,
      period,
      createdAt: new Date()
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: UpdateBooking): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const newWeekNumber = updates.weekNumber ?? existingBooking.weekNumber;
    const newYear = updates.year ?? existingBooking.year;
    
    // Validate new week number if provided
    if (updates.weekNumber && (newWeekNumber < 14 || newWeekNumber > 44)) {
      throw new Error(`Invalid week number: ${newWeekNumber}. Must be between 14-44`);
    }
    
    // Check for duplicate if week/year is changing
    if (updates.weekNumber || updates.year) {
      const duplicateBooking = Array.from(this.bookings.values())
        .find(b => b.id !== id && b.userId === existingBooking.userId && b.weekNumber === newWeekNumber && b.year === newYear);
      
      if (duplicateBooking) {
        throw new Error(`User already has a booking for week ${newWeekNumber} in ${newYear}`);
      }
    }
    
    const updatedBooking: Booking = {
      ...existingBooking,
      weekNumber: newWeekNumber,
      year: newYear,
      period: this.derivePeriodFromWeek(newWeekNumber)
    };
    
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async deleteBookingByUserAndWeek(userId: string, weekNumber: number, year = this.currentYear): Promise<boolean> {
    const booking = Array.from(this.bookings.entries())
      .find(([, b]) => b.userId === userId && b.weekNumber === weekNumber && b.year === year);
    
    if (booking) {
      return this.bookings.delete(booking[0]);
    }
    return false;
  }

  async getPeriodStats(userId?: string, year = this.currentYear): Promise<PeriodStats[]> {
    const periods = [
      { id: 1, name: 'Vårperiod (Vecka 14-23)', weeks: Array.from({length: 10}, (_, i) => i + 14) },
      { id: 2, name: 'Sommarperiod (Vecka 24-33)', weeks: Array.from({length: 10}, (_, i) => i + 24) },
      { id: 3, name: 'Höstperiod (Vecka 34-44)', weeks: Array.from({length: 11}, (_, i) => i + 34) }
    ];

    return periods.map(period => {
      const periodBookings = Array.from(this.bookings.values())
        .filter(b => b.period === period.id && b.year === year);
      
      const userBookings = userId 
        ? periodBookings
            .filter(b => b.userId === userId)
            .map(b => b.weekNumber)
            .sort((a, b) => a - b)
        : [];
        
      return {
        id: period.id,
        name: period.name,
        totalWeeks: period.weeks.length,
        userBookings,
        availableSlots: (period.weeks.length * 5) - periodBookings.length // Max 5 per week minus current bookings
      };
    });
  }

  async getWeekBookings(weekNumber: number, year = this.currentYear): Promise<WeekBooking[]> {
    const weekBookings = await this.getBookingsByWeek(weekNumber, year);
    
    const result: WeekBooking[] = [];
    for (const booking of weekBookings) {
      const user = this.users.get(booking.userId);
      if (user) {
        result.push({
          userId: user.id,
          username: user.username
        });
      }
    }
    
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllBookings(year = this.currentYear): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(b => b.year === year);
  }

  // Helper methods
  private derivePeriodFromWeek(weekNumber: number): number {
    if (weekNumber >= 14 && weekNumber <= 23) return 1; // Spring
    if (weekNumber >= 24 && weekNumber <= 33) return 2; // Summer
    if (weekNumber >= 34 && weekNumber <= 44) return 3; // Fall
    throw new Error(`Week ${weekNumber} is not in any valid period (14-23, 24-33, 34-44)`);
  }

  private getPeriodName(period: number): string {
    switch (period) {
      case 1: return 'Vårperiod';
      case 2: return 'Sommarperiod';
      case 3: return 'Höstperiod';
      default: return 'Okänd period';
    }
  }

  private getWeekDateRange(weekNumber: number): string {
    const year = this.currentYear;
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToFirstWeek = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysToFirstWeek * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
  }

  private createDevAdminUser() {
    // Only for development - this is a security risk in production
    // Use synchronous bcrypt for dev admin creation to avoid async constructor issues
    // bcrypt is already imported at the top
    const hashedPassword = bcrypt.hashSync('admin', 10);
    
    const adminUser: User = {
      id: randomUUID(),
      username: 'admin', 
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    console.log('⚠️  DEV: Admin user created - username: admin, password: admin (HASHED - CHANGE IN PRODUCTION!)');
  }
}

export const storage = new MemStorage();
