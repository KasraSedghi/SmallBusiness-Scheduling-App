export default function AvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white-cream">
      {children}
    </div>
  );
}
