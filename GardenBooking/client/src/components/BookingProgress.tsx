import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface BookingProgressProps {
  bookedWeeks: number;
  requiredWeeks: number;
}

export default function BookingProgress({ bookedWeeks, requiredWeeks }: BookingProgressProps) {
  const progressPercentage = Math.min((bookedWeeks / requiredWeeks) * 100, 100);
  const isCompleted = bookedWeeks >= requiredWeeks;
  const remainingWeeks = Math.max(0, requiredWeeks - bookedWeeks);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Bokningsstatus</h3>
        <Badge 
          variant={isCompleted ? "default" : "secondary"}
          className="flex items-center gap-1"
          data-testid="badge-status"
        >
          {isCompleted ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Uppfyllt
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              {remainingWeeks} veckor kvar
            </>
          )}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Bokade veckor</span>
          <span data-testid="text-progress">{bookedWeeks} av {requiredWeeks}</span>
        </div>
        <Progress value={progressPercentage} className="h-3" data-testid="progress-booking" />
        
        {!isCompleted && (
          <p className="text-sm text-muted-foreground">
            Du behöver boka minst {requiredWeeks} veckor per år för trädgårdsarbete.
          </p>
        )}
        
        {isCompleted && (
          <p className="text-sm text-primary">
            Bra jobbat! Du har uppfyllt årets krav på trädgårdsarbete.
          </p>
        )}
      </div>
    </div>
  );
}