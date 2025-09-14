import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WeekGrid, { type PeriodData } from "./WeekGrid";
import { ArrowLeft, Calendar, Info } from "lucide-react";

interface PeriodDetailViewProps {
  period: PeriodData;
  onBack: () => void;
  onBookWeek: (weekNumber: number) => void;
  onCancelBooking: (weekNumber: number) => void;
}

export default function PeriodDetailView({ 
  period, 
  onBack, 
  onBookWeek, 
  onCancelBooking 
}: PeriodDetailViewProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  const userBookings = period.weeks.filter(week => week.isUserBooking);
  const totalBookings = period.weeks.reduce((sum, week) => sum + (week.bookings?.length || 0), 0);
  
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
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{period.name}</h1>
              <p className="text-sm text-muted-foreground">
                {period.totalWeeks} veckor • {userBookings.length} bokade • {totalBookings} totala bokningar
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              data-testid="button-info"
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
                Periodinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totalt antal veckor</p>
                  <p className="text-2xl font-semibold">{period.totalWeeks}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dina bokningar</p>
                  <p className="text-2xl font-semibold text-primary">{userBookings.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Totala bokningar</p>
                  <p className="text-2xl font-semibold text-accent-foreground">{totalBookings}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Instruktioner</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Klicka på en vecka för att boka den (flera kan boka samma vecka)</li>
                  <li>• Klicka på dina egna bokningar för att avboka</li>
                  <li>• Du behöver totalt minst 6 veckor per år</li>
                  <li>• Flera medlemmar kan boka samma vecka för gemensamt arbete</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Grid */}
        <WeekGrid 
          period={period}
          onBookWeek={onBookWeek}
          onCancelBooking={onCancelBooking}
        />

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {userBookings.length} veckor bokade
              </Badge>
              
              {userBookings.length > 0 && (
                <Badge variant="outline">
                  Veckor: {userBookings.map(w => w.weekNumber).join(', ')}
                </Badge>
              )}
              
              {totalBookings > 0 && (
                <Badge variant="secondary">
                  {totalBookings} totala bokningar i perioden
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}