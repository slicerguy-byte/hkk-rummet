import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeekSlot {
  weekNumber: number;
  bookings: Array<{
    userId: string;
    username: string;
  }>;
  isUserBooking: boolean;
}

export interface PeriodData {
  id: number;
  name: string;
  totalWeeks: number;
  weeks: WeekSlot[];
}

interface WeekGridProps {
  period: PeriodData;
  onBookWeek: (weekNumber: number) => void;
  onCancelBooking: (weekNumber: number) => void;
}

export default function WeekGrid({ period, onBookWeek, onCancelBooking }: WeekGridProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  const userBookings = period.weeks.filter(week => week.isUserBooking);
  const totalBookings = period.weeks.reduce((sum, week) => sum + (week.bookings?.length || 0), 0);

  const handleWeekClick = (week: WeekSlot) => {
    if (week.isUserBooking) {
      console.log('Cancel booking for week:', week.weekNumber);
      onCancelBooking(week.weekNumber);
    } else {
      console.log('Book week:', week.weekNumber);
      onBookWeek(week.weekNumber);
    }
    setSelectedWeek(week.weekNumber);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {period.name}
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {period.totalWeeks} veckor
          </Badge>
        </CardTitle>
        <CardDescription>
          Du har bokat {userBookings.length} veckor i denna period. 
          Totalt {totalBookings} bokningar gjorda i perioden.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-5 gap-3">
          {period.weeks.map((week) => {
            const bookingCount = week.bookings?.length || 0;
            const hasOtherBookings = bookingCount > 0 && !week.isUserBooking;
            
            return (
              <Button
                key={week.weekNumber}
                variant={week.isUserBooking ? "default" : bookingCount > 0 ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-14 flex flex-col gap-1 relative",
                  week.isUserBooking && "bg-primary hover:bg-primary/90",
                  "hover-elevate"
                )}
                onClick={() => handleWeekClick(week)}
                data-testid={`button-week-${week.weekNumber}`}
              >
                <span className="text-xs font-medium">V{week.weekNumber}</span>
                
                {bookingCount > 0 && (
                  <span className="text-[10px] opacity-75">
                    {bookingCount} {bookingCount === 1 ? 'person' : 'personer'}
                  </span>
                )}
                
                {week.isUserBooking && (
                  <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-primary-foreground" />
                )}
                
                {hasOtherBookings && (
                  <User className="h-3 w-3 absolute -top-1 -right-1 text-secondary-foreground" />
                )}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span>Dina bokningar ({userBookings.length})</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-secondary border rounded-sm" />
            <span>Andra medlemmars bokningar</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 border border-border rounded-sm" />
            <span>Inga bokningar</span>
          </div>
        </div>

        {selectedWeek && (
          <div className="p-4 bg-muted rounded-lg text-sm" data-testid="selection-feedback">
            {period.weeks.find(w => w.weekNumber === selectedWeek)?.isUserBooking 
              ? `Avbokad vecka ${selectedWeek}` 
              : `Bokad vecka ${selectedWeek}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}