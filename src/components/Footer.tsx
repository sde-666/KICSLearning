import React from 'react';
import { Lock } from 'lucide-react';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="mt-auto py-8 text-center text-xs sm:text-sm text-slate-500 border-t border-slate-200/60 bg-white select-none">
      <div className="max-w-7xl mx-auto px-4 space-y-1.5">
        <p className="font-medium text-slate-700">
          Karamraji Learning Portal &bull; Karamraji Institute of Computer Science &amp; IT
        </p>
        <p>
          Developed by{' '}
          <a
            href="https://github.com/sde-666"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1565c0] font-semibold hover:underline"
          >
            Mr. Aditya Pathak
          </a>
        </p>

        {onAdminClick && (
          <div className="pt-2">
            <button
              onClick={onAdminClick}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Administrator and Faculty Login (/admin)"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Login (/admin)</span>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};
