import { PublicFooter } from "@/components/layout/public/footer";
import { PublicNavbar } from "@/components/layout/public/navbar";
import { FloatingThemeToggle } from "@/components/layout/floating-theme-toggle";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        {children}
      </main>
      <PublicFooter />
      <FloatingThemeToggle />
    </div>
  );
}
