/* eslint-disable prettier/prettier */
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto px-6 py-24 text-center">
        <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          Coming soon.
        </span>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{description}</p>
      </main>
      <Footer />
    </div>
  );
}