'use client';

export default function AvailabilityPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-red-bean mb-4">
          Submit Your Availability
        </h1>
        <p className="text-gray-600 mb-8">
          Mobile-friendly form for weekly shift preferences and time-off requests
        </p>

        {/* Placeholder for availability form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600">
            Shift selector and preference form will be rendered here.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Minimum requirements: 2 shifts AND 8 hours per week
          </p>
        </div>
      </div>
    </div>
  );
}
