import Dashboard, { type User } from '../Dashboard'
import { type Period } from '../PeriodCard'

export default function DashboardExample() {
  // todo: remove mock functionality
  const mockUser: User = {
    id: "1",
    username: "anna.andersson",
    totalBookings: 4,
    isAdmin: false,
    upcomingBookings: [
      {
        periodName: "Vårperiod",
        weekNumber: 16,
        date: "14-20 Apr"
      },
      {
        periodName: "Sommarperiod", 
        weekNumber: 28,
        date: "8-14 Jul"
      }
    ]
  };

  const mockPeriods: Period[] = [
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

  return (
    <Dashboard 
      user={mockUser}
      periods={mockPeriods}
      onViewPeriod={(id) => console.log('View period:', id)}
      onLogout={() => console.log('Logout')}
    />
  )
}