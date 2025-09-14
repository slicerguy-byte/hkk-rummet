import PeriodCard, { type Period } from '../PeriodCard'

export default function PeriodCardExample() {
  const mockPeriod: Period = {
    id: 1,
    name: "Vårperiod",
    weeks: 10,
    startWeek: 1,
    endWeek: 10,
    description: "Vårens trädgårdsarbete: beskärning, plantering och allmän underhåll.",
    availableSlots: 45,
    totalSlots: 60,
    userBookings: [3, 7] // User has booked weeks 3 and 7
  };

  return (
    <div className="p-4 max-w-sm">
      <PeriodCard 
        period={mockPeriod}
        onViewDetails={(id) => console.log('View period details:', id)}
      />
    </div>
  )
}