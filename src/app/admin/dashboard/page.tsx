'use client';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-bean mb-4">
        Admin Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        Intuitive scheduling panel for business owners
      </p>

      {/* Placeholder for dashboard components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-red-bean mb-4">
            Pending Schedules
          </h2>
          <p className="text-gray-600">Review and approve pending submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-red-bean mb-4">
            Shift Coverage
          </h2>
          <p className="text-gray-600">Audit shift coverage and constraints</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-red-bean mb-4">
            Email Reminders
          </h2>
          <p className="text-gray-600">Manage automatic reminder dispatch</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-red-bean mb-4">
            Final Roster
          </h2>
          <p className="text-gray-600">Publish weekly schedule</p>
        </div>
      </div>
    </div>
  );
}
