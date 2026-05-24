import React from 'react';
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  Users, 
  X, 
  LogOut, 
  Printer
} from 'lucide-react';
import { UserAmil } from '../types/lazis';

interface SidebarProps {
  activeTab: 'dashboard' | 'penerimaan' | 'penyaluran' | 'kategori' | 'user' | 'report';
  setActiveTab: (tab: 'dashboard' | 'penerimaan' | 'penyaluran' | 'kategori' | 'user' | 'report') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: UserAmil | null;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  onLogout
}: SidebarProps) {
  return (
    <aside className={`w-72 bg-linear-to-b from-emerald-900 to-emerald-950 text-emerald-100 flex flex-col shrink-0 border-r border-emerald-800 transition-all duration-300 fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Logo */}
      <div className="p-6 border-b border-emerald-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-inner overflow-hidden">
            <img 
                src="/pwa-icon-512.png" 
                alt="Logo LAZIS Al-Madinah" 
                className="w-full h-full object-contain p-1.5"
              />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight leading-5">LAZISWaf AL-MADINAH</h2>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-emerald-300 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'penerimaan', label: 'Penerimaan', icon: ArrowDownLeft },
          { id: 'penyaluran', label: 'Penyaluran', icon: ArrowUpRight },
          { id: 'kategori', label: 'Kategori ZIS', icon: Layers },
          { id: 'report', label: 'Laporan Bulanan', icon: Printer },
          { id: 'user', label: 'Pengaturan User', icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20' 
                  : 'text-emerald-300/80 hover:bg-emerald-800/30 hover:text-emerald-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-emerald-400/80'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-emerald-800/40 bg-emerald-950/30 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-700/50 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-200 uppercase">
            {currentUser?.nama.charAt(0)}
          </div>
          <div className="truncate flex-1">
            <h4 className="text-xs font-bold text-white leading-4 truncate">{currentUser?.nama}</h4>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {currentUser?.role}
            </span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-emerald-400 hover:text-rose-200 transition-colors"
          title="Keluar / Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
