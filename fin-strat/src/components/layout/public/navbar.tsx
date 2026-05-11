import Link from "next/link";
import { siteConfig } from "@/config/site";
import { publicNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-2">
          {publicNavItems.map((item) => (
            <Button key={item.href} asChild variant="ghost">
              <Link href={item.href}>{item.title}</Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
