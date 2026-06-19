interface ScheduleCardProps {
  employeeName: string;
  status: 'pending' | 'approved' | 'published';
  submittedAt: string;
  hoursPerWeek: number;
}

export default function ScheduleCard({
  employeeName,
  status,
  submittedAt,
  hoursPerWeek,
}: ScheduleCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    published: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-red-bean">{employeeName}</h3>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            statusColors[status]
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-600">Submitted: {submittedAt}</p>
      <p className="text-sm text-gray-600">Hours: {hoursPerWeek}h</p>
    </div>
  );
}
