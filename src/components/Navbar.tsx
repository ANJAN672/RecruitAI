import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './AuthProvider';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = profile?.full_name || user?.email || '?';
  const initial = displayName[0]?.toUpperCase() ?? '?';
  const roleBadge = profile?.role === 'candidate' ? 'Candidate' : 'Recruiter';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">RecruitAI</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <span className="text-sm text-neutral-600 hidden sm:block max-w-[160px] truncate">{user?.email}</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-neutral-100 rounded-2xl shadow-xl shadow-neutral-100/50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-neutral-50">
                    <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 font-medium">{roleBadge}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-neutral-400" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
