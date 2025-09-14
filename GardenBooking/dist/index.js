// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
var MemStorage = class {
  users;
  bookings;
  currentYear;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.bookings = /* @__PURE__ */ new Map();
    this.currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    if (process.env.NODE_ENV === "development") {
      this.createDevAdminUser();
    }
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      id,
      isAdmin: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async getUserWithStats(id) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const userBookings = Array.from(this.bookings.values()).filter((b) => b.userId === id && b.year === this.currentYear);
    const upcomingBookings = userBookings.sort((a, b) => a.weekNumber - b.weekNumber).slice(0, 3).map((booking) => ({
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
  async getBooking(id) {
    return this.bookings.get(id);
  }
  async getBookingsByUser(userId, year = this.currentYear) {
    return Array.from(this.bookings.values()).filter((b) => b.userId === userId && b.year === year);
  }
  async getBookingsByWeek(weekNumber, year = this.currentYear) {
    return Array.from(this.bookings.values()).filter((b) => b.weekNumber === weekNumber && b.year === year);
  }
  async getBookingsByPeriod(period, year = this.currentYear) {
    return Array.from(this.bookings.values()).filter((b) => b.period === period && b.year === year);
  }
  async createBooking(insertBooking) {
    const year = insertBooking.year ?? this.currentYear;
    const weekNumber = insertBooking.weekNumber;
    const period = this.derivePeriodFromWeek(weekNumber);
    if (weekNumber < 14 || weekNumber > 44) {
      throw new Error(`Invalid week number: ${weekNumber}. Must be between 14-44`);
    }
    const existingBooking = Array.from(this.bookings.values()).find((b) => b.userId === insertBooking.userId && b.weekNumber === weekNumber && b.year === year);
    if (existingBooking) {
      throw new Error(`User already has a booking for week ${weekNumber} in ${year}`);
    }
    const id = randomUUID();
    const booking = {
      ...insertBooking,
      id,
      year,
      period,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.bookings.set(id, booking);
    return booking;
  }
  async updateBooking(id, updates) {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return void 0;
    const newWeekNumber = updates.weekNumber ?? existingBooking.weekNumber;
    const newYear = updates.year ?? existingBooking.year;
    if (updates.weekNumber && (newWeekNumber < 14 || newWeekNumber > 44)) {
      throw new Error(`Invalid week number: ${newWeekNumber}. Must be between 14-44`);
    }
    if (updates.weekNumber || updates.year) {
      const duplicateBooking = Array.from(this.bookings.values()).find((b) => b.id !== id && b.userId === existingBooking.userId && b.weekNumber === newWeekNumber && b.year === newYear);
      if (duplicateBooking) {
        throw new Error(`User already has a booking for week ${newWeekNumber} in ${newYear}`);
      }
    }
    const updatedBooking = {
      ...existingBooking,
      weekNumber: newWeekNumber,
      year: newYear,
      period: this.derivePeriodFromWeek(newWeekNumber)
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  async deleteBooking(id) {
    return this.bookings.delete(id);
  }
  async deleteBookingByUserAndWeek(userId, weekNumber, year = this.currentYear) {
    const booking = Array.from(this.bookings.entries()).find(([, b]) => b.userId === userId && b.weekNumber === weekNumber && b.year === year);
    if (booking) {
      return this.bookings.delete(booking[0]);
    }
    return false;
  }
  async getPeriodStats(userId, year = this.currentYear) {
    const periods = [
      { id: 1, name: "V\xE5rperiod (Vecka 14-23)", weeks: Array.from({ length: 10 }, (_, i) => i + 14) },
      { id: 2, name: "Sommarperiod (Vecka 24-33)", weeks: Array.from({ length: 10 }, (_, i) => i + 24) },
      { id: 3, name: "H\xF6stperiod (Vecka 34-44)", weeks: Array.from({ length: 11 }, (_, i) => i + 34) }
    ];
    return periods.map((period) => {
      const periodBookings = Array.from(this.bookings.values()).filter((b) => b.period === period.id && b.year === year);
      const userBookings = userId ? periodBookings.filter((b) => b.userId === userId).map((b) => b.weekNumber).sort((a, b) => a - b) : [];
      return {
        id: period.id,
        name: period.name,
        totalWeeks: period.weeks.length,
        userBookings,
        availableSlots: period.weeks.length * 5 - periodBookings.length
        // Max 5 per week minus current bookings
      };
    });
  }
  async getWeekBookings(weekNumber, year = this.currentYear) {
    const weekBookings = await this.getBookingsByWeek(weekNumber, year);
    const result = [];
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
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  async getAllBookings(year = this.currentYear) {
    return Array.from(this.bookings.values()).filter((b) => b.year === year);
  }
  // Helper methods
  derivePeriodFromWeek(weekNumber) {
    if (weekNumber >= 14 && weekNumber <= 23) return 1;
    if (weekNumber >= 24 && weekNumber <= 33) return 2;
    if (weekNumber >= 34 && weekNumber <= 44) return 3;
    throw new Error(`Week ${weekNumber} is not in any valid period (14-23, 24-33, 34-44)`);
  }
  getPeriodName(period) {
    switch (period) {
      case 1:
        return "V\xE5rperiod";
      case 2:
        return "Sommarperiod";
      case 3:
        return "H\xF6stperiod";
      default:
        return "Ok\xE4nd period";
    }
  }
  getWeekDateRange(weekNumber) {
    const year = this.currentYear;
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToFirstWeek = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysToFirstWeek * 24 * 60 * 60 * 1e3);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1e3);
    return `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
  }
  createDevAdminUser() {
    const hashedPassword = bcrypt.hashSync("admin", 10);
    const adminUser = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(adminUser.id, adminUser);
    console.log("\u26A0\uFE0F  DEV: Admin user created - username: admin, password: admin (HASHED - CHANGE IN PRODUCTION!)");
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  period: integer("period").notNull(),
  // Derived from weekNumber: 1=Spring(14-23), 2=Summer(24-33), 3=Fall(34-44)
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
}, (table) => ({
  // Unique constraint: one booking per user per week per year
  uniqueUserWeekYear: sql`UNIQUE (${table.userId}, ${table.weekNumber}, ${table.year})`
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  weekNumber: true,
  year: true
}).extend({
  year: z.number().optional()
  // Will default to current year in storage
});
var updateBookingSchema = z.object({
  weekNumber: z.number().min(14).max(44).optional(),
  year: z.number().min((/* @__PURE__ */ new Date()).getFullYear() - 1).max((/* @__PURE__ */ new Date()).getFullYear() + 5).optional()
});

// server/routes.ts
import { z as z2 } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt2 from "bcryptjs";
var MemoryStoreSession = MemoryStore(session);
var loginSchema = z2.object({
  username: z2.string().min(1, "Username is required"),
  password: z2.string().min(1, "Password is required")
});
var registerSchema = z2.object({
  username: z2.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  password: z2.string().min(6, "Password must be at least 6 characters").max(100, "Password too long")
});
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt2.hash(password, saltRounds);
}
async function comparePassword(password, hashedPassword) {
  return bcrypt2.compare(password, hashedPassword);
}
var requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
var requireAdmin = async (req, res, next) => {
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
async function registerRoutes(app2) {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET;
  if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  app2.use(session({
    secret: sessionSecret || "dev-secret-key-NOT-FOR-PRODUCTION-" + Math.random(),
    store: new MemoryStoreSession({
      checkPeriod: 864e5
      // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      // HTTPS only in production
      httpOnly: true,
      sameSite: "lax",
      // CSRF protection
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const normalizedUsername = userData.username.toLowerCase().trim();
      const existingUser = await storage.getUserByUsername(normalizedUsername);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        username: normalizedUsername,
        password: hashedPassword
      });
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Registration failed" });
        }
        req.session.userId = user.id;
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid input",
          errors: error.errors
        });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.regenerate(async (err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        req.session.userId = user.id;
        const userWithStats = await storage.getUserWithStats(user.id);
        if (userWithStats) {
          const { password: password2, ...userResponse } = userWithStats;
          res.json({ user: userResponse });
        } else {
          const { password: password2, ...userWithoutPassword } = user;
          res.json({ user: { ...userWithoutPassword, totalBookings: 0, upcomingBookings: [] } });
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid input",
          errors: error.errors
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/me", requireAuth, async (req, res) => {
    try {
      const userWithStats = await storage.getUserWithStats(req.session.userId);
      if (!userWithStats) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userResponse } = userWithStats;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid booking data",
          errors: error.errors
        });
      }
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({
          message: "You have already booked this week"
        });
      }
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  app2.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings2 = await storage.getBookingsByUser(req.session.userId);
      res.json({ bookings: bookings2 });
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });
  app2.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session.userId;
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
      console.error("Delete booking error:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });
  app2.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session.userId;
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const user = await storage.getUser(userId);
      if (existingBooking.userId !== userId && !user?.isAdmin) {
        return res.status(403).json({ message: "You can only update your own bookings" });
      }
      const updateData = updateBookingSchema.parse(req.body);
      const updatedBooking = await storage.updateBooking(bookingId, updateData);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json({ booking: updatedBooking });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: error.errors
        });
      }
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({
          message: "A booking for this week already exists"
        });
      }
      console.error("Update booking error:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });
  app2.get("/api/bookings/all", requireAdmin, async (req, res) => {
    try {
      const bookings2 = await storage.getAllBookings();
      res.json({ bookings: bookings2 });
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ message: "Failed to get all bookings" });
    }
  });
  app2.post("/api/bookings/admin", requireAdmin, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const targetUser = await storage.getUser(bookingData.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const booking = await storage.createBooking(bookingData);
      res.status(201).json({ booking });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid booking data",
          errors: error.errors
        });
      }
      if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("unique"))) {
        return res.status(400).json({
          message: "This user has already booked this week"
        });
      }
      console.error("Admin create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
