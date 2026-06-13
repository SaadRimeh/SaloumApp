import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type AppTheme = {
  bg: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  modalOverlay: string;
  headerBg: string;
  tabBarBg: string;
};

type AppContextType = {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  theme: AppTheme;
};

const defaultTheme: AppTheme = {
  bg: '#121212',
  card: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: 'rgba(197, 168, 128, 0.15)',
  modalOverlay: 'rgba(0,0,0,0.7)',
  headerBg: '#161616',
  tabBarBg: '#161616',
};

const AppContext = createContext<AppContextType>({
  isDark: true,
  setIsDark: () => {},
  isArabic: true,
  setIsArabic: () => {},
  theme: defaultTheme,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [isArabic, setIsArabic] = useState(true);

  const theme: AppTheme = {
    bg: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#121212',
    textSecondary: isDark ? '#888888' : '#666666',
    border: isDark ? 'rgba(197, 168, 128, 0.15)' : 'rgba(197, 168, 128, 0.3)',
    modalOverlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    headerBg: isDark ? '#161616' : '#FFFFFF',
    tabBarBg: isDark ? '#161616' : '#FFFFFF',
  };

  return (
    <AppContext.Provider value={{ isDark, setIsDark, isArabic, setIsArabic, theme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
