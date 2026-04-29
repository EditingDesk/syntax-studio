import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Image,
  Wand2,
  Settings,
  HelpCircle,
  Crown,
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Products", icon: Package, path: "/products" },
  { name: "Models", icon: Users, path: "/models" },
  { name: "Generations", icon: Image, path: "/generations" },
  { name: "Tools", icon: Wand2, path: "/tools" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function MainTemplate({ children }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[260px] shrink-0 border-r border-black/10 bg-white p-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white font-bold">
              S
            </div>
            <div>
              <h1 className="text-base font-bold">Syntax Studio</h1>
              <p className="text-xs text-black/50">AI Image Generator</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#ecfee8] text-black"
                        : "text-black/70 hover:bg-[#ecfee8]"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <Crown size={16} />
                Pro Plan
              </div>

              <div className="mt-5 flex justify-between text-xs">
                <span className="text-black/55">Credits Used</span>
                <span className="font-bold">12,540 / 50,000</span>
              </div>

              <div className="mt-3 h-2 rounded-full bg-black/10">
                <div className="h-2 w-1/4 rounded-full bg-[#c2efeb]" />
              </div>

              <button className="mt-5 w-full rounded-xl bg-[#ecfee8] px-4 py-3 text-sm font-bold">
                Upgrade Plan
              </button>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <HelpCircle size={18} />
                <div>
                  <p className="text-sm font-bold">Need Help?</p>
                  <p className="text-xs text-black/50">Visit documentation</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm md:max-w-md">
                <Search size={18} className="text-black/45" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-black/40"
                  placeholder="Search generations, products, models..."
                />
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-bold shadow-sm">
                  Credits&nbsp; 12,540
                </div>

                <button className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                  <Bell size={18} />
                </button>

                <button className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 shadow-sm">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-white">
                    A
                  </div>

                  <div className="hidden text-left md:block">
                    <p className="text-sm font-bold">Admin</p>
                    <p className="text-xs text-black/50">Pro Plan</p>
                  </div>

                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </header>

          <section className="flex-1 px-4 py-6 lg:px-8">
            {children}

            <footer className="mt-10 border-t border-black/10 py-5 text-center text-sm text-black/50">
              © Laksh
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}