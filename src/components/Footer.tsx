/* eslint-disable prettier/prettier */
import markAsset from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="relative mt-4 overflow-hidden border-t border-border/40 bg-background">
      <div className="absolute inset-x-0 -top-px h-1 bg-[var(--gradient-brand)]" />
      <div className="grid w-full gap-5 px-6 py-4 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={markAsset} alt="" loading="lazy" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-extrabold tracking-wide bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, oklch(0.6 0.22 300), oklch(0.55 0.22 295))" }}
                >
                  VARSITY
                </span>
                <span className="text-lg font-extrabold tracking-wide text-brand-cyan">HUB</span>
              </div>
              <span className="mt-0.5 text-[9px] font-medium tracking-[0.2em] text-brand-cyan">
                THAT'S TECH FOR YOU
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Your gateway to South African universities. Apply, track and discover all in one place.
          </p>
        </div>
        <FooterCol title="Platform" links={["Universities", "Programs", "Career Guidance", "Eligibility"]} />
        <FooterCol title="Company" links={["About", "Contact", "Privacy", "Terms"]} />
        <FooterCol title="Support" links={["Help Center", "FAQ", "Status", "Partners"]} />
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Varsity Hub. That's tech for you.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-1.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}