import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBookingSchema, updateBookingSchema, type User, type UserWithStats, type Booking } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";

const MemoryStoreSession = MemoryStore(session);

// Authentication schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Safe registration schema - only allow specific fields
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
});

// Helper functions
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Extend express session type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with security hardening
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error('SESSION_SECRET must be at least 32 characters in production');
  }
  
  app.use(session({
    secret: sessionSecret || 'dev-secret-key-NOT-FOR-PRODUCTION-' + Math.random(),
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  
  // POST /api/register - Create new user account
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Normalize username
      const normalizedUsername = userData.username.toLowerCase().trim();
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(normalizedUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with safe data only
      const user = await storage.createUser({
        username: normalizedUsername,
        password: hashedPassword
      });
      
      // Regenerate session on login for security
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Registration failed" });
        }
        
        // Create session
        req.session.userId = user.id;
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.errors 
        });
      }
      console.error('Register error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/login - Authenticate user
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Find user by username (normalize for lookup)
      const user = await storage.getUserByUsername(username.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password using secure comparison
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Regenerate session on login for security
      req.session.regenerate(async (err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Create session
        req.session.userId = user.id;
        
        // Return user with stats
        const userWithStats = await storage.getUserWithStats(user.id);
        if (userWithStats) {
          const { password, ...userResponse } = userWithStats;
          res.json({ user: userResponse });
        } else {
          const { password, ...userWithoutPassword } = user;
          res.json({ user: { ...userWithoutPassword, totalBookings: 0, upcomingBookings: [] } });
        }
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.errors 
        });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // POST /api/logout - Clear session
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // GET /api/me - Get current user info
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const userWithStats = await storage.getUserWithStats(req.session.userId!);
      if (!userWithStats) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userResponse } = userWithStats;
      res.json({ user: userResponse });
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Booking Management API
  
  // POST /api/bookings - Create new booking
  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      
      // Check for duplicate booking error
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({ 
          message: "You have already booked this week" 
        });
      }
      
      console.error('Create booking error:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  
  // GET /api/bookings - Get user's bookings
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByUser(req.session.userId!);
      res.json({ bookings });
      
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });
  
  // DELETE /api/bookings/:id - Delete a booking
  app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session.userId!;
      
      // Verify the booking belongs to the user (or user is admin)
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(userId);
      if (booking.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "You can only delete your own bookings" });
      }
      
      await storage.deleteBooking(bookingId);
      res.json({ message: "Booking deleted successfully" });
      
    } catch (error) {
      console.error('Delete booking error:', error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });
  
  // PATCH /api/bookings/:id - Update a booking
  app.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session.userId!;
      
      // Verify the booking exists and belongs to the user (or user is admin)
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(userId);
      if (existingBooking.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "You can only update your own bookings" });
      }
      
      // Validate update data
      const updateData = updateBookingSchema.parse(req.body);
      
      // Update booking
      const updatedBooking = await storage.updateBooking(bookingId, updateData);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json({ booking: updatedBooking });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors 
        });
      }
      
      // Check for duplicate booking error
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({ 
          message: "A booking for this week already exists" 
        });
      }
      
      console.error('Update booking error:', error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });
  
  // Admin routes
  
  // GET /api/bookings/all - Get all bookings (admin only)
  app.get("/api/bookings/all", requireAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json({ bookings });
      
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ message: "Failed to get all bookings" });
    }
  });
  
  // POST /api/bookings/admin - Create booking for another user (admin only)
  app.post("/api/bookings/admin", requireAdmin, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Verify the target user exists
      const targetUser = await storage.getUser(bookingData.userId!);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      
      // Check for duplicate booking error
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({ 
          message: "This user has already booked this week" 
        });
      }
      
      console.error('Admin create booking error:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
