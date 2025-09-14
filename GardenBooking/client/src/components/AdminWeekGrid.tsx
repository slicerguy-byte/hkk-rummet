import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, User, Calendar, UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type WeekSlot, type PeriodData } from "./WeekGrid";

interface AdminWeekGridProps {
  period: PeriodData;
  onBookWeekForUser: (weekNumber: number, userId: string, username: string) => void;
  onCancelBookingForUser: (weekNumber: number, userId: string) => void;
}

export default function AdminWeekGrid({ period, onBookWeekForUser, onCancelBookingForUser }: AdminWeekGridProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedWeekForBooking, setSelectedWeekForBooking] = useState<WeekSlot | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  
  const userBookings = period.weeks.filter(week => week.isUserBooking);
  const totalBookings = period.weeks.reduce((sum, week) => sum + (week.bookings?.length || 0), 0);

  const handleWeekClick = (week: WeekSlot) => {
    setSelectedWeek(week.weekNumber);
    setSelectedWeekForBooking(week);
  };

  const handleBookUser = () => {
    if (!selectedWeekForBooking || !newUserName.trim()) return;
    
    const userId = `user-${Date.now()}`;
    console.log(`Admin booking week ${selectedWeekForBooking.weekNumber} for user ${newUserName}`);
    onBookWeekForUser(selectedWeekForBooking.weekNumber, userId, newUserName.trim());
    
    setNewUserName("");
    setShowBookingDialog(false);
    setSelectedWeekForBooking(null);
  };

  const handleCancelBooking = (week: WeekSlot, booking: { userId: string; username: string }) => {
    console.log(`Admin cancelling booking for week ${week.weekNumber} for user ${booking.username}`);
    onCancelBookingForUser(week.weekNumber, booking.userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {period.name}
          <Badge variant="destructive" className="flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            Admin Vy
          </Badge>
        </CardTitle>
        <CardDescription>
          Totalt {totalBookings} bokningar i denna period. Klicka på en vecka för att se detaljer eller hantera bokningar.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-5 gap-3">
          {period.weeks.map((week) => {
            const bookingCount = week.bookings?.length || 0;
            
            return (
              <Button
                key={week.weekNumber}
                variant={selectedWeek === week.weekNumber ? "default" : bookingCount > 0 ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-16 flex flex-col gap-1 relative",
                  selectedWeek === week.weekNumber && "bg-primary hover:bg-primary/90",
                  "hover-elevate"
                )}
                onClick={() => handleWeekClick(week)}
                data-testid={`admin-button-week-${week.weekNumber}`}
              >
                <span className="text-xs font-medium">V{week.weekNumber}</span>
                
                {bookingCount > 0 && (
                  <span className="text-[10px] opacity-75">
                    {bookingCount} {bookingCount === 1 ? 'person' : 'personer'}
                  </span>
                )}
                
                {bookingCount > 0 && (
                  <User className="h-3 w-3 absolute -top-1 -right-1" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Selected Week Details */}
        {selectedWeekForBooking && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Vecka {selectedWeekForBooking.weekNumber} - Detaljer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWeekForBooking.bookings && selectedWeekForBooking.bookings.length > 0 ? (
                <div>
                  <h4 className="font-medium text-sm mb-2">Bokade användare:</h4>
                  <div className="space-y-2">
                    {selectedWeekForBooking.bookings.map((booking, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-user-${booking.userId}`}>
                            {booking.username}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(selectedWeekForBooking, booking)}
                          data-testid={`button-cancel-${booking.userId}`}
                          className="flex items-center gap-1"
                        >
                          <UserMinus className="h-3 w-3" />
                          Avboka
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Inga bokningar för denna vecka</p>
              )}

              <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-book-for-user">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Boka för användare
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Boka vecka {selectedWeekForBooking.weekNumber} för användare</DialogTitle>
                    <DialogDescription>
                      Ange användarnamnet för personen som ska boka denna vecka.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Användarnamn</Label>
                      <Input
                        id="username"
                        data-testid="input-admin-username"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ange användarnamn..."
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleBookUser} disabled={!newUserName.trim()} data-testid="button-confirm-booking">
                      Bekräfta bokning
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span>Vald vecka</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-secondary border rounded-sm" />
            <span>Har bokningar</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 border border-border rounded-sm" />
            <span>Inga bokningar</span>
          </div>
        </div>

        {selectedWeek && (
          <div className="p-4 bg-muted rounded-lg text-sm" data-testid="admin-selection-feedback">
            Vecka {selectedWeek} är vald - använd funktionerna ovan för att hantera bokningar
          </div>
        )}
      </CardContent>
    </Card>
  );
}