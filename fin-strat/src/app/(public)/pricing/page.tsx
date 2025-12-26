export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-center">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Basic</h2>
          <p className="text-3xl font-bold mb-4">$9.99/mo</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Pro</h2>
          <p className="text-3xl font-bold mb-4">$29.99/mo</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Enterprise</h2>
          <p className="text-3xl font-bold mb-4">$99.99/mo</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

