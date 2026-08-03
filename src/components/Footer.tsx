import { Link } from 'react-router-dom';
import { FileText, HelpCircle, Lightbulb, Shield, Target } from 'lucide-react';

/**
 * Mirror of the main site's footer (www.playwithprompts.com) so both apps read
 * as one brand. Cross-site links do a full page load to www; "How it works"
 * stays local to the game.
 */
export function Footer() {
  return (
    <footer className="py-12 px-6 bg-gradient-to-r from-slate-50 to-slate-100 mt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <Link
            to="/how"
            className="flex items-center gap-2 hover:text-purple-600 transition-colors text-slate-600 font-medium"
          >
            <Target size={18} />
            <span>How it works</span>
          </Link>
          <a
            href="https://www.playwithprompts.com/about"
            className="flex items-center gap-2 hover:text-purple-600 transition-colors text-slate-600 font-medium"
          >
            <Lightbulb size={18} />
            <span>About</span>
          </a>
          <a
            href="https://www.playwithprompts.com/help"
            className="flex items-center gap-2 hover:text-teal-600 transition-colors text-slate-600 font-medium"
          >
            <HelpCircle size={18} />
            <span>Help</span>
          </a>
          <a
            href="https://www.playwithprompts.com/legal"
            className="flex items-center gap-2 hover:text-blue-600 transition-colors text-slate-600 font-medium"
          >
            <Shield size={18} />
            <span>Privacy</span>
          </a>
          <a
            href="https://www.playwithprompts.com/legal"
            className="flex items-center gap-2 hover:text-green-600 transition-colors text-slate-600 font-medium"
          >
            <FileText size={18} />
            <span>Terms</span>
          </a>
        </div>
        <div className="text-center">
          <p className="text-slate-600 font-medium">
            One round a day. Made with 💡 by Play with Prompts.
          </p>
        </div>
      </div>
    </footer>
  );
}
