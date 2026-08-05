'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

const SidebarContext = createContext({
  isCollapsed: false,
  setIsCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  isMobile: false,
  toggleSidebar: () => {},
  closeMobileSidebar: () => {},
});

export function SidebarProvider({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Collapsed state on desktop (70px vs 260px)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Drawer open state on tablet & mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer automatically if resized to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        mobileOpen,
        setMobileOpen,
        isMobile,
        toggleSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
