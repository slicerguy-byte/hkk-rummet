import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import BookingProgress from "./BookingProgress";
import PeriodCard, { type Period } from "./PeriodCard";
import { Calendar, Settings, LogOut, User } from "lucide-react";

export interface User {
  id: string;
  username: string;
  totalBookings: number;
  isAdmin: boolean;
  upcomingBookings: Array<{
    periodName: string;
    weekNumber: number;
    date: string;
  }>;
}

interface DashboardProps {
  user: User;
  periods: Period[];
  onViewPeriod: (periodId: number) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, periods, onViewPeriod, onLogout }: DashboardProps) {
  const currentYear = new Date().getFullYear();
  const requiredBookings = 6;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Trädgårdsbokningar</h1>
                <p className="text-sm text-muted-foreground">{currentYear}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback data-testid="avatar-user">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm" data-testid="text-username">{user.username}</p>
                  {user.isAdmin && (
                    <Badge variant="destructive" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.totalBookings} veckor bokade
                </p>
              </div>
              
              <Button variant="ghost" size="icon" data-testid="button-logout" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BookingProgress bookedWeeks={user.totalBookings} requiredWeeks={requiredBookings} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kommande arbetspass</CardTitle>
              <CardDescription>Dina närmaste bokade veckor</CardDescription>
            </CardHeader>
            <CardContent>
              {user.upcomingBookings.length > 0 ? (
                <div className="space-y-2">
                  {user.upcomingBookings.slice(0, 3).map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                      <div>
                        <p className="font-medium text-sm">{booking.periodName}</p>
                        <p className="text-xs text-muted-foreground">Vecka {booking.weekNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {booking.date}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Inga kommande bokningar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Periods Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Bokningsperioder {currentYear}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                onViewDetails={onViewPeriod}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Snabblänkar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="justify-start" 
                data-testid="button-view-all-bookings"
                onClick={() => {
                  console.log("Showing all bookings");
                  alert("Funktion under utveckling: Visa alla bokningar för året");
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Alla bokningar
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                data-testid="button-settings"
                onClick={() => {
                  console.log("Opening settings");
                  alert("Funktion under utveckling: Användarinställningar");
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Inställningar
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                data-testid="button-help"
                onClick={() => {
                  console.log("Opening help");
                  alert("Hjälp: Kontakta styrelsen för frågor om trädgårdsbokningar.\n\n• Boka minst 6 veckor per år\n• Flera kan boka samma vecka\n• Avboka senast 1 vecka innan");
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Hjälp
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                data-testid="button-contact"
                onClick={() => {
                  console.log("Opening contact");
                  alert("Kontakt: bostadsrattsforening@example.com\n\nTelefon: 08-123 45 67\nStylesen träffas varje måndag kl 19:00");
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Kontakt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}