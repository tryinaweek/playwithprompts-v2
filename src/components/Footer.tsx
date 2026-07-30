import { Link } from 'react-router-dom';

/**
 * The original course site.
 *
 * Deliberately an inner path, not the bare apex: once playwithprompts.com/
 * serves this game, a link to the apex would bounce straight back here.
 * When the old site is parked at old.playwithprompts.com, point this there.
 */
export const LEARN_URL = 'https://playwithprompts.com/courses';

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
