import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

const THEME_KEY = 'taskly.theme';

const getInitialTheme = () => {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Default: system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            light: '#4db6ac',
            main: '#009688',
            dark: '#00695c',
            contrastText: '#ffffff',
          },
          secondary: {
            light: '#90a4ae',
            main: '#607d8b',
            dark: '#37474f',
            contrastText: '#ffffff',
          },
          divider: mode === 'dark' ? '#2f3134' : '#e0e3e7',
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#18191A',
                  paper: '#242526',
                },
                text: {
                  primary: '#E4E6EB',
                  secondary: '#B0B3B8',
                },
              }
            : {
                background: {
                  default: '#f4f7f6',
                  paper: '#fff',
                },
                text: {
                  primary: '#18191A',
                  secondary: '#333',
                },
              }),
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'dark' ? '#2f3134' : '#e0e3e7'}`,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundImage: 'none',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                marginInline: 8,
              },
            },
          },
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
          },
        },
      }),
    [mode]
  );

  const value = useMemo(() => ({ mode, toggleTheme }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
