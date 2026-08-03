import { Link, useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';

import { LEARN_URL } from './Footer';

/** Short labels on purpose — this bar has to survive a 375px phone. */
const NAV_ITEMS = [
  { to: '/', label: 'Play' },
  { to: '/prompts', label: 'Prompts' },
  { to: '/me', label: 'Stats' },
];

export function Header() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
        {/* Brand header: the site is Play with Prompts; "Catch the AI" is the
            game's own title on the play screen. Wordmark hides on phones so
            four nav items fit at 375px. */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap hidden sm:inline">
            Play with Prompts
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {/* Cross-site link — full page load, not a SPA route. */}
          <a
            href={LEARN_URL}
            className="px-2.5 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Courses
          </a>
        </nav>
      </div>
    </header>
  );
}
