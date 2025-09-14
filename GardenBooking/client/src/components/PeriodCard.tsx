import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock } from "lucide-react";

export interface Period {
  id: number;
  name: string;
  weeks: number;
  startWeek: number;
  endWeek: number;
  description: string;
  availableSlots: number;
  totalSlots: number;
  userBookings: number[];
}

interface PeriodCardProps {
  period: Period;
  onViewDetails: (periodId: number) => void;
}

export default function PeriodCard({ period, onViewDetails }: PeriodCardProps) {
  const bookedSlots = period.totalSlots - period.availableSlots;
  const utilizationPercentage = (bookedSlots / period.totalSlots) * 100;
  const hasUserBookings = period.userBookings.length > 0;

  return (
    <Card className="hover-elevate cursor-pointer transition-all" onClick={() => onViewDetails(period.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{period.name}</CardTitle>
          {hasUserBookings && (
            <Badge variant="default" data-testid={`badge-user-bookings-${period.id}`}>
              {period.userBookings.length} bokad{period.userBookings.length !== 1 ? 'e' : ''}
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Vecka {period.startWeek}-{period.endWeek} ({period.weeks} veckor)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{period.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`text-availability-${period.id}`}>
              {period.availableSlots} lediga av {period.totalSlots}
            </span>
          </div>
          
          <Badge 
            variant={utilizationPercentage > 80 ? "destructive" : utilizationPercentage > 50 ? "secondary" : "outline"}
            data-testid={`badge-utilization-${period.id}`}
          >
            {Math.round(utilizationPercentage)}% bokat
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 bg-secondary rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          variant={hasUserBookings ? "outline" : "default"}
          data-testid={`button-view-period-${period.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(period.id);
          }}
        >
          {hasUserBookings ? "Hantera bokningar" : "Boka veckor"}
        </Button>
      </CardContent>
    </Card>
  );
}