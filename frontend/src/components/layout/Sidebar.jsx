import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  BrainCircuit,
  AlertTriangle,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  X,
  Gauge
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Machines', path: '/machines', icon: Cpu },
  { name: 'Live Monitoring', path: '/live', icon: Activity },
  { name: 'Predictions', path: '/predictions', icon: BrainCircuit },
  { name: 'Alerts', path: '/alerts', icon: AlertTriangle, hasBadge: true },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadAlertsCount } = useSocket();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Maintenance Engineer': return 'bg-sky-100 text-sky-700 border-sky-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 text-lg leading-none">PMIS AI</span>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-sky-600 mt-0.5">Predictive Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-inherit" />
                  <span>{item.name}</span>
                </div>
                {item.hasBadge && unreadAlertsCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-full animate-pulse">
                    {unreadAlertsCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Operator'}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 font-medium rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 text-xs font-medium text-slate-600 transition-colors border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
