interface ShiftSelectorProps {
  onShiftsChange?: (shifts: string[]) => void;
}

export default function ShiftSelector({ onShiftsChange }: ShiftSelectorProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="font-semibold text-red-bean mb-4">Select Your Shifts</h3>
      {/* Placeholder for shift selection UI */}
      <p className="text-sm text-gray-600">
        Shift selector component for employee preference submission
      </p>
    </div>
  );
}
