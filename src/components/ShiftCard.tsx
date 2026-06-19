interface ShiftCardProps {
  day: string;
  startTime: string;
  endTime: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function ShiftCard({
  day,
  startTime,
  endTime,
  selected = false,
  onClick,
}: ShiftCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition ${
        selected
          ? 'border-red-bean bg-red-bean text-white'
          : 'border-gray-300 bg-white hover:border-red-bean'
      }`}
    >
      <div className="font-semibold">{day}</div>
      <div className="text-sm">
        {startTime} - {endTime}
      </div>
    </button>
  );
}
