import React, { useState, useEffect } from 'react';
import { Menu, Bell, Play, Square, Wifi, WifiOff, Clock } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { simulationService } from '../../services/dashboardService';
import { Link } from 'react-router-dom';

export const Topbar = ({ onMenuClick, title = 'Industrial Overview' }) => {
  const { isConnected, simulationRunning, setSimulationRunning, unreadAlertsCount, clearAlertCount } = useSocket();
  const [simLoading, setSimLoading] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSimulation = async () => {
    setSimLoading(true);
    try {
      if (simulationRunning) {
        await simulationService.stop();
        setSimulationRunning(false);
      } else {
        await simulationService.start();
        setSimulationRunning(true);
      }
    } catch (err) {
      console.error('Simulation toggle failed:', err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">Industrial IoT Telemetry & ML Diagnostics</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-500 bg-slate-100 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Real-time Socket Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={isConnected ? 'Live WebSocket Connected' : 'Disconnected from Gateway'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Telemetry Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-500" />
              <span className="hidden sm:inline">Offline</span>
            </>
          )}
        </div>

        {/* Simulator Toggle Button */}
        <button
          onClick={handleToggleSimulation}
          disabled={simLoading}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
            simulationRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          }`}
        >
          {simulationRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Sim</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Sim</span>
            </>
          )}
        </button>

        {/* Notification Bell */}
        <Link
          to="/alerts"
          onClick={clearAlertCount}
          className="relative p-2 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="View Active Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce">
              {unreadAlertsCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
