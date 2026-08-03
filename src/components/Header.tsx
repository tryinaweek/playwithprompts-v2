import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Bot, BookOpen, Library, Lightbulb, Menu, Target, X } from 'lucide-react';

/**
 * Mirror of the main site's header (www.playwithprompts.com AppHeader) so the
 * game and the course site read as one brand: same gradient logo block, same
 * gradient wordmark + subtitle, same pill nav with gradient active state.
 * Cross-site items do a full page load to www.
 */
const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof Target;
  external?: boolean;
}[] = [
  { href: '/', label: 'Play', icon: Target },
  { href: '/prompts', label: 'Prompts', icon: Library },
  { href: '/me', label: 'Stats', icon: BarChart3 },
  { href: 'https://www.playwithprompts.com/courses', label: 'Courses', icon: BookOpen, external: true },
  { href: 'https://www.playwithprompts.com/daily-ai-tip', label: 'Daily AI Tip', icon: Lightbulb, external: true },
];

export function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const itemClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
        : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm'
    }`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo — identical to the main site */}
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Play with Prompts
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block">Master AI, not just prompts</p>
            </div>
          </Link>

          {/* Desktop pill nav */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 backdrop-blur-sm rounded-full p-1 border border-gray-200/50">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a key={item.href} href={item.href} className={itemClass(false)}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <Link key={item.href} to={item.href} className={itemClass(isActive(item.href))}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <nav className="md:hidden mt-4 pb-2 flex flex-col gap-1 border-t border-gray-100 pt-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const rowClass = (active: boolean) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`;
              if (item.external) {
                return (
                  <a key={item.href} href={item.href} className={rowClass(false)}>
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={rowClass(isActive(item.href))}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
