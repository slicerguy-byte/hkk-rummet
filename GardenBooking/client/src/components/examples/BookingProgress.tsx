import BookingProgress from '../BookingProgress'

export default function BookingProgressExample() {
  return (
    <div className="p-6 max-w-md">
      <BookingProgress bookedWeeks={4} requiredWeeks={6} />
    </div>
  )
}