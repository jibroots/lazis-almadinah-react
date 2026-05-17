import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setSidebarOpen: (open: boolean) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function Header({
  activeTab,
  setSidebarOpen,
  isLoading,
  onRefresh
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 shrink-0 px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-slate-900 shrink-0">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Masjid</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
            {activeTab}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Database Online Cloud (Neon PostgreSQL)
        </span>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Sinkronisasi
        </button>
      </div>
    </header>
  );
}
