import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveReadings, setLiveReadings] = useState({}); // machineId -> { reading, prediction, healthScore, status }
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [latestAlertToast, setLatestAlertToast] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to backend gateway');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend gateway');
      setIsConnected(false);
    });

    socketInstance.on('simulation_status', (status) => {
      setSimulationRunning(status?.isRunning || false);
    });

    socketInstance.on('sensor_reading', (data) => {
      setLiveReadings((prev) => ({
        ...prev,
        [data.machineId]: data
      }));
    });

    socketInstance.on('new_alert', (data) => {
      setUnreadAlertsCount((prev) => prev + 1);
      setLatestAlertToast(data);

      // Auto clear toast after 6 seconds
      setTimeout(() => {
        setLatestAlertToast((current) => (current?.alert?._id === data.alert?._id ? null : current));
      }, 6000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearAlertCount = () => setUnreadAlertsCount(0);
  const dismissToast = () => setLatestAlertToast(null);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      liveReadings,
      simulationRunning,
      setSimulationRunning,
      unreadAlertsCount,
      clearAlertCount,
      latestAlertToast,
      dismissToast
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
