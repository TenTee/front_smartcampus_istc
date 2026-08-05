'use client';

import { createTheme } from '@mui/material/styles';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const createAppTheme = (config: any = {}) => {
  const primaryColor = config?.couleur_primaire || '#193A7F';
  const secondaryColor = config?.couleur_secondaire || '#FF9800'; 
  const textColor = config?.couleur_texte || '#333333';
  const fontFamily = config?.typographie || inter.style.fontFamily;

  return createTheme({
    typography: {
      fontFamily: fontFamily,
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    palette: {
      mode: 'light',
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        default: '#F5F7FA',
        paper: '#FFFFFF',
      },
      text: {
        primary: textColor,
        secondary: '#666666',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0px 4px 10px ${primaryColor}40`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          elevation1: {
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            maxHeight: 340,
            overflowY: 'auto',
            borderRadius: 8,
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            '& .MuiList-root': {
              maxHeight: 340,
              overflowY: 'auto',
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
            PaperProps: {
              style: {
                maxHeight: 340,
                overflowY: 'auto',
              },
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            maxHeight: 340,
            overflowY: 'auto',
          },
          listbox: {
            maxHeight: 340,
            overflowY: 'auto',
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            maxHeight: 340,
          },
        },
      },
    },
  });
};

export const theme = createAppTheme();
