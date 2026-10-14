/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import markAsset from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/universities", label: "Universities" },
  { to: "/programs", label: "Programs" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-20 w-full items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={markAsset} alt="" loading="lazy" className="h-12 w-12 md:h-14 md:w-14 object-contain" />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-2">
              <span
                className="text-xl md:text-2xl font-extrabold tracking-wide bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, oklch(0.6 0.22 300), oklch(0.55 0.22 295))" }}
              >
                VARSITY
              </span>
              <span className="text-xl md:text-2xl font-extrabold tracking-wide text-brand-cyan">HUB</span>
            </div>
            <span className="mt-0.5 text-[9px] md:text-[10px] font-medium tracking-[0.25em] text-brand-cyan">
              THAT'S TECH FOR YOU
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold border-b-2 border-primary pb-1" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:bg-primary/90 hover:shadow-[var(--shadow-card)]"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}