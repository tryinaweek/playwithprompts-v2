import { Link, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Play with Prompts</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/learn"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/learn')
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Learn
          </Link>
        </nav>
      </div>
    </header>
  );
}
