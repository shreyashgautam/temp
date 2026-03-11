import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,hsl(var(--primary)/0.16),transparent_32%),radial-gradient(circle_at_90%_6%,hsl(var(--accent)/0.18),transparent_28%),linear-gradient(160deg,hsl(var(--background))_0%,hsl(var(--secondary))_100%)]" />
      <Sidebar />
      <div className="relative ml-64 flex min-h-screen flex-col">
        <Header />
        <main className="relative z-10 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
