import { Link, useLocation } from 'react-router-dom';
import { Target } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Play' },
  { to: '/how', label: 'How it works' },
  { to: '/me', label: 'My stats' },
];

/**
 * The original course site, kept one click away.
 *
 * Deliberately an inner path, not the apex: once playwithprompts.com/ redirects
 * to this game, a link to the bare apex would bounce straight back here.
 */
const LEARN_URL = 'https://playwithprompts.com/courses';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:inline">Catch the AI</span>
          <span className="text-lg font-bold text-gray-900 sm:hidden">Catch&nbsp;the&nbsp;AI</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={LEARN_URL}
            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            Learn
          </a>
        </nav>
      </div>
    </header>
  );
}
