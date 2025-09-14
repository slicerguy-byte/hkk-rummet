import { useState, useEffect } from "react";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginForm from "./components/LoginForm";
import Dashboard, { type User } from "./components/Dashboard";
import PeriodDetailView from "./components/PeriodDetailView";
import AdminPeriodDetailView from "./components/AdminPeriodDetailView";
import ThemeToggle from "./components/ThemeToggle";
import { type Period } from "./components/PeriodCard";
import { type PeriodData, type WeekSlot } from "./components/WeekGrid";

// todo: remove mock functionality - this will be replaced with real data from backend
const createMockPeriods = (): Period[] => [
  {
    id: 1,
    name: "Vårperiod",
    weeks: 10,
    startWeek: 14,
    endWeek: 23,
    description: "Vårens trädgårdsarbete: beskärning, plantering och allmän underhåll.",
    availableSlots: 45,
    totalSlots: 60,
    userBookings: [16, 20]
  },
  {
    id: 2,
    name: "Sommarperiod",
    weeks: 10,
    startWeek: 24,
    endWeek: 33,
    description: "Sommarens trädgårdsarbete: gräsklippning, bevattning och allmän skötsel.",
    availableSlots: 52,
    totalSlots: 60,
    userBookings: [28]
  },
  {
    id: 3,
    name: "Höstperiod",
    weeks: 11,
    startWeek: 34,
    endWeek: 44,
    description: "Höstens trädgårdsarbete: lövrensning, beskärning och vinterforberedelser.",
    availableSlots: 41,
    totalSlots: 66,
    userBookings: []
  }
];

const createPeriodData = (period: Period): PeriodData => {
  // todo: remove mock functionality - generate realistic week data
  const weeks: WeekSlot[] = [];
  for (let i = 1; i <= period.weeks; i++) {
    const weekNumber = period.startWeek + i - 1;
    const isUserBooking = period.userBookings.includes(weekNumber);
    const bookings = [];
    
    // Add user booking if applicable
    if (isUserBooking) {
      bookings.push({ userId: "current-user", username: "Du" });
    }
    
    // Add some mock other bookings
    const otherBookingsCount = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
    for (let j = 0; j < otherBookingsCount; j++) {
      bookings.push({
        userId: `user-${j + 2}`,
        username: `Medlem ${Math.floor(Math.random() * 20) + 1}`
      });
    }
    
    weeks.push({
      weekNumber,
      bookings,
      isUserBooking
    });
  }

  return {
    id: period.id,
    name: `${period.name} (Vecka ${period.startWeek}-${period.endWeek})`,
    totalWeeks: period.weeks,
    weeks
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "period-detail">("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodData | null>(null);
  const [periods, setPeriods] = useState<Period[]>(createMockPeriods());
  const [authLoading, setAuthLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.log('No authenticated user found');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/login', {
        username,
        password,
      });
      
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      alert('Inloggning misslyckades. Kontrollera dina uppgifter.');
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/register', {
        username,
        password,
      });
      
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registrering misslyckades. Försök igen eller välj ett annat användarnamn.');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      setCurrentUser(null);
      setCurrentView("dashboard");
      setSelectedPeriod(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setCurrentUser(null);
      setCurrentView("dashboard");
      setSelectedPeriod(null);
    }
  };

  const handleViewPeriod = (periodId: number) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      const periodData = createPeriodData(period);
      setSelectedPeriod(periodData);
      setCurrentView("period-detail");
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedPeriod(null);
  };

  // todo: remove mock functionality - connect to backend API
  const handleBookWeek = (weekNumber: number) => {
    if (!selectedPeriod || !currentUser) return;
    
    console.log(`Booking week ${weekNumber} for user ${currentUser.username}`);
    
    // Update the period data
    const updatedPeriod = {
      ...selectedPeriod,
      weeks: selectedPeriod.weeks.map(week => 
        week.weekNumber === weekNumber 
          ? { 
              ...week, 
              bookings: [...week.bookings, { userId: currentUser.id, username: currentUser.username }],
              isUserBooking: true
            }
          : week
      )
    };
    setSelectedPeriod(updatedPeriod);

    // Update the periods data and user stats
    const updatedPeriods = periods.map(period => {
      if (period.id === selectedPeriod.id) {
        return {
          ...period,
          userBookings: [...period.userBookings, weekNumber].sort((a, b) => a - b),
          availableSlots: period.availableSlots - 1
        };
      }
      return period;
    });
    setPeriods(updatedPeriods);

    // Update user's total bookings
    const totalBookings = updatedPeriods.reduce((total, period) => total + period.userBookings.length, 0);
    setCurrentUser(prev => prev ? { ...prev, totalBookings } : null);
  };

  // todo: remove mock functionality - connect to backend API
  const handleCancelBooking = (weekNumber: number) => {
    if (!selectedPeriod || !currentUser) return;
    
    console.log(`Cancelling week ${weekNumber} for user ${currentUser.username}`);
    
    // Update the period data
    const updatedPeriod = {
      ...selectedPeriod,
      weeks: selectedPeriod.weeks.map(week => 
        week.weekNumber === weekNumber && week.isUserBooking
          ? { 
              ...week, 
              bookings: week.bookings.filter(booking => booking.userId !== currentUser.id),
              isUserBooking: false
            }
          : week
      )
    };
    setSelectedPeriod(updatedPeriod);

    // Update the periods data and user stats
    const updatedPeriods = periods.map(period => {
      if (period.id === selectedPeriod.id) {
        return {
          ...period,
          userBookings: period.userBookings.filter(w => w !== weekNumber),
          availableSlots: period.availableSlots + 1
        };
      }
      return period;
    });
    setPeriods(updatedPeriods);

    // Update user's total bookings
    const totalBookings = updatedPeriods.reduce((total, period) => total + period.userBookings.length, 0);
    setCurrentUser(prev => prev ? { ...prev, totalBookings } : null);
  };

  // Admin functions
  const handleBookWeekForUser = (weekNumber: number, userId: string, username: string) => {
    if (!selectedPeriod || !currentUser?.isAdmin) return;
    
    console.log(`Admin booking week ${weekNumber} for user ${username}`);
    
    // Update the period data
    const updatedPeriod = {
      ...selectedPeriod,
      weeks: selectedPeriod.weeks.map(week => 
        week.weekNumber === weekNumber 
          ? { 
              ...week, 
              bookings: [...week.bookings, { userId, username }],
              isUserBooking: userId === currentUser.id
            }
          : week
      )
    };
    setSelectedPeriod(updatedPeriod);

    // Update the periods data
    const updatedPeriods = periods.map(period => {
      if (period.id === selectedPeriod.id) {
        // If booking for current user, update userBookings array
        if (userId === currentUser.id) {
          return {
            ...period,
            userBookings: [...period.userBookings, weekNumber].sort((a, b) => a - b)
          };
        }
        return period;
      }
      return period;
    });
    setPeriods(updatedPeriods);
  };

  const handleCancelBookingForUser = (weekNumber: number, userId: string) => {
    if (!selectedPeriod || !currentUser?.isAdmin) return;
    
    console.log(`Admin cancelling week ${weekNumber} for user ${userId}`);
    
    // Update the period data
    const updatedPeriod = {
      ...selectedPeriod,
      weeks: selectedPeriod.weeks.map(week => 
        week.weekNumber === weekNumber 
          ? { 
              ...week, 
              bookings: week.bookings.filter(booking => booking.userId !== userId),
              isUserBooking: userId === currentUser.id ? false : week.isUserBooking
            }
          : week
      )
    };
    setSelectedPeriod(updatedPeriod);

    // Update the periods data
    const updatedPeriods = periods.map(period => {
      if (period.id === selectedPeriod.id) {
        // If cancelling for current user, update userBookings array
        if (userId === currentUser.id) {
          return {
            ...period,
            userBookings: period.userBookings.filter(w => w !== weekNumber)
          };
        }
        return period;
      }
      return period;
    });
    setPeriods(updatedPeriods);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Theme Toggle - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        {authLoading ? (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar...</p>
            </div>
          </div>
        ) : !currentUser ? (
          <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
        ) : currentView === "dashboard" ? (
          <Dashboard
            user={currentUser}
            periods={periods}
            onViewPeriod={handleViewPeriod}
            onLogout={handleLogout}
          />
        ) : currentView === "period-detail" && selectedPeriod ? (
          currentUser.isAdmin ? (
            <AdminPeriodDetailView
              period={selectedPeriod}
              onBack={handleBackToDashboard}
              onBookWeekForUser={handleBookWeekForUser}
              onCancelBookingForUser={handleCancelBookingForUser}
            />
          ) : (
            <PeriodDetailView
              period={selectedPeriod}
              onBack={handleBackToDashboard}
              onBookWeek={handleBookWeek}
              onCancelBooking={handleCancelBooking}
            />
          )
        ) : null}

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
