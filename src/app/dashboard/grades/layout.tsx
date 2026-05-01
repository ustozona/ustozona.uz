export default function GradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      {children}
    </div>
  );
}
