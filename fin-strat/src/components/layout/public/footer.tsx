import Link from "next/link";
import { footerNavItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.copyright}. All rights
          reserved.
        </p>
        <div className="flex gap-6">
          {footerNavItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
