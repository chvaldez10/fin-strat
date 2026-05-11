"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import { publicNavGroups, publicNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight">
          {siteConfig.name}
        </Link>

        <div className="hidden flex-1 justify-center lg:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {publicNavGroups.map((group) => (
                <NavigationMenuItem key={group.title}>
                  <NavigationMenuTrigger className="bg-transparent">
                    {group.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="fixed! inset-x-0! top-[73px]! z-50! mt-0! w-auto! max-w-none! translate-x-0! overflow-visible! rounded-none! border-x-0! border-y! border-border! bg-background/95 p-0! shadow-lg backdrop-blur data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4">
                    <div className="container mx-auto grid grid-cols-[0.8fr_1fr_1fr_1fr] gap-x-12 gap-y-8 px-4 py-10">
                      <div className="min-w-0">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          {group.title}
                        </p>
                        <h3 className="mt-4 text-2xl font-bold tracking-tight">
                          Explore {group.title.toLowerCase()}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {group.description}
                        </p>
                      </div>
                      {group.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <NavigationMenuLink key={item.title} asChild>
                            <Link
                              href={item.href}
                              className="group grid min-w-0 grid-cols-[auto_1fr] gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/70"
                            >
                              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                                <Icon className="size-5" />
                              </span>
                              <span className="min-w-0 self-center">
                                <span className="block text-xl font-medium leading-none">
                                  {item.title}
                                </span>
                                <span className="mt-2 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost">
            <Link href="/login">Preview form</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Get started</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-l-3xl p-0">
            <SheetHeader className="border-b border-border p-6 text-left">
              <SheetTitle className="text-3xl font-black tracking-tight">
                {siteConfig.name}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-8 p-6">
              {publicNavGroups.map((group) => (
                <section key={group.title} className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{group.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <SheetClose
                          key={`${group.title}-${item.title}`}
                          asChild
                        >
                          <Link
                            href={item.href}
                            className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
                          >
                            <span>
                              <span className="block text-lg font-medium">
                                {item.title}
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">
                                {item.description}
                              </span>
                            </span>
                            <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
                              <Icon className="size-5" />
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="sticky bottom-0 border-t border-border bg-background p-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Quick links
              </p>
              <div className="grid gap-1">
                {publicNavItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Preview form
                  </Link>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
