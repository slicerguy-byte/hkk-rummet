import PeriodDetailView from '../PeriodDetailView'
import { type PeriodData, type WeekSlot } from '../WeekGrid'

export default function PeriodDetailViewExample() {
  // todo: remove mock functionality
  const mockWeeks: WeekSlot[] = [
    { weekNumber: 1, bookings: [], isUserBooking: false },
    { weekNumber: 2, bookings: [{ userId: "user1", username: "Anna Andersson" }], isUserBooking: false },
    { weekNumber: 3, bookings: [{ userId: "current-user", username: "Du" }], isUserBooking: true },
    { weekNumber: 4, bookings: [], isUserBooking: false },
    { weekNumber: 5, bookings: [{ userId: "user2", username: "Erik Eriksson" }, { userId: "user3", username: "Lisa Larsson" }], isUserBooking: false },
    { weekNumber: 6, bookings: [], isUserBooking: false },
    { weekNumber: 7, bookings: [{ userId: "current-user", username: "Du" }], isUserBooking: true },
    { weekNumber: 8, bookings: [], isUserBooking: false },
    { weekNumber: 9, bookings: [], isUserBooking: false },
    { weekNumber: 10, bookings: [{ userId: "user4", username: "Maria Svensson" }], isUserBooking: false },
  ];

  const mockPeriod: PeriodData = {
    id: 1,
    name: "Vårperiod (Vecka 1-10)",
    totalWeeks: 10,
    weeks: mockWeeks
  };

  return (
    <PeriodDetailView 
      period={mockPeriod}
      onBack={() => console.log('Go back')}
      onBookWeek={(week) => console.log('Book week:', week)}
      onCancelBooking={(week) => console.log('Cancel week:', week)}
    />
  )
}