import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminWeekGrid from "./AdminWeekGrid";
import { ArrowLeft, Calendar, Info, Shield } from "lucide-react";
import { type PeriodData } from "./WeekGrid";

interface AdminPeriodDetailViewProps {
  period: PeriodData;
  onBack: () => void;
  onBookWeekForUser: (weekNumber: number, userId: string, username: string) => void;
  onCancelBookingForUser: (weekNumber: number, userId: string) => void;
}

export default function AdminPeriodDetailView({ 
  period, 
  onBack, 
  onBookWeekForUser, 
  onCancelBookingForUser 
}: AdminPeriodDetailViewProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  const totalBookings = period.weeks.reduce((sum, week) => sum + (week.bookings?.length || 0), 0);
  const totalUsers = new Set(
    period.weeks.flatMap(week => week.bookings?.map(b => b.userId) || [])
  ).size;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              data-testid="admin-button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{period.name}</h1>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {period.totalWeeks} veckor • {totalBookings} totala bokningar • {totalUsers} unika användare
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              data-testid="admin-button-info"
            >
              <Info className="h-4 w-4 mr-1" />
              Info
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Period Information */}
        {showInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Admin Periodinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totalt antal veckor</p>
                  <p className="text-2xl font-semibold">{period.totalWeeks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totala bokningar</p>
                  <p className="text-2xl font-semibold text-primary">{totalBookings}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unika användare</p>
                  <p className="text-2xl font-semibold text-accent-foreground">{totalUsers}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Genomsnitt/användare</p>
                  <p className="text-2xl font-semibold text-secondary-foreground">
                    {totalUsers > 0 ? (totalBookings / totalUsers).toFixed(1) : 0}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Admin funktioner</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Klicka på en vecka för att se alla bokningar</li>
                  <li>• Boka veckor åt andra användare</li>
                  <li>• Avboka befintliga bokningar</li>
                  <li>• Se fullständiga namn på alla som bokat</li>
                  <li>• Hantera bokningar för hela organisationen</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Week Grid */}
        <AdminWeekGrid 
          period={period}
          onBookWeekForUser={onBookWeekForUser}
          onCancelBookingForUser={onCancelBookingForUser}
        />

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {totalBookings} totala bokningar
              </Badge>
              
              <Badge variant="outline">
                {totalUsers} användare har bokat
              </Badge>
              
              {totalUsers > 0 && (
                <Badge variant="secondary">
                  Snitt: {(totalBookings / totalUsers).toFixed(1)} bokningar/användare
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}