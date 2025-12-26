export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Fin Strat. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

