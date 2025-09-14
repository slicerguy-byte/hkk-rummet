import AdminWeekGrid from '../AdminWeekGrid'
import { type PeriodData, type WeekSlot } from '../WeekGrid'

export default function AdminWeekGridExample() {
  // todo: remove mock functionality
  const mockWeeks: WeekSlot[] = [
    { weekNumber: 14, bookings: [], isUserBooking: false },
    { weekNumber: 15, bookings: [{ userId: "user1", username: "Anna Andersson" }], isUserBooking: false },
    { weekNumber: 16, bookings: [
      { userId: "admin", username: "Admin" },
      { userId: "user2", username: "Erik Svensson" }
    ], isUserBooking: true },
    { weekNumber: 17, bookings: [], isUserBooking: false },
    { weekNumber: 18, bookings: [
      { userId: "user3", username: "Maria Larsson" },
      { userId: "user4", username: "John Doe" },
      { userId: "user5", username: "Lisa Nilsson" }
    ], isUserBooking: false },
    { weekNumber: 19, bookings: [], isUserBooking: false },
    { weekNumber: 20, bookings: [{ userId: "admin", username: "Admin" }], isUserBooking: true },
    { weekNumber: 21, bookings: [], isUserBooking: false },
    { weekNumber: 22, bookings: [{ userId: "user6", username: "Per Johansson" }], isUserBooking: false },
    { weekNumber: 23, bookings: [], isUserBooking: false },
  ];

  const mockPeriod: PeriodData = {
    id: 1,
    name: "Vårperiod (Vecka 14-23)",
    totalWeeks: 10,
    weeks: mockWeeks
  };

  return (
    <div className="p-6 max-w-4xl">
      <AdminWeekGrid 
        period={mockPeriod}
        onBookWeekForUser={(week, userId, username) => console.log('Admin book week:', week, 'for user:', username)}
        onCancelBookingForUser={(week, userId) => console.log('Admin cancel week:', week, 'for user:', userId)}
      />
    </div>
  )
}