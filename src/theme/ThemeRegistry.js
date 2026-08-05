'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme as defaultTheme, createAppTheme } from './theme';
import { configurationEtablissementService } from '../services/api/services';
import createEmotionCache from './createEmotionCache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';

export const ConfigContext = React.createContext(null);

export default function ThemeRegistry({ children }) {
  const [config, setConfig] = React.useState(null);
  const [activeTheme, setActiveTheme] = React.useState(defaultTheme);

  // Create a client-side cache. On the server this will be created per render.
  const cacheRef = React.useRef();
  if (!cacheRef.current) {
    cacheRef.current = createEmotionCache();
  }

  // Inject server-side Emotion styles into the HTML head
  useServerInsertedHTML(() => {
    const { sheet } = cacheRef.current;
    const styles = sheet?.tags?.map((tag) => tag.textContent).join('') || '';
    return <style data-emotion={`css ${cacheRef.current.key}`} dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  const loadThemeConfig = async () => {
    try {
      const data = await configurationEtablissementService.getCurrent();
      if (data) {
        setConfig(data);
        setActiveTheme(createAppTheme(data));
      }
    } catch (error) {
      console.error('Erreur chargement configuration theme', error);
    }
  };

  React.useEffect(() => {
    loadThemeConfig();

    const handleConfigChange = () => {
      loadThemeConfig();
    };

    window.addEventListener('appConfigChanged', handleConfigChange);
    return () => {
      window.removeEventListener('appConfigChanged', handleConfigChange);
    };
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      <CacheProvider value={cacheRef.current}>
        <ThemeProvider theme={activeTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ConfigContext.Provider>
  );
}
