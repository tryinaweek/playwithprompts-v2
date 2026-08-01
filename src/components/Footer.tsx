import { Link } from 'react-router-dom';

/**
 * The original course site, which now lives on the www hostname.
 *
 * The apex serves this game; www still points at the old origin (185.158.133.1),
 * which already had www configured. Must NOT be the apex or an apex path —
 * those resolve to this app and would 404.
 */
export const LEARN_URL = 'https://www.playwithprompts.com/courses';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <Link to="/how" className="hover:text-gray-900">
            How it works
          </Link>
          <a href={LEARN_URL} className="hover:text-gray-900">
            Courses
          </a>
        </div>
        <p>One round a day. Made by Play with Prompts.</p>
      </div>
    </footer>
  );
}
