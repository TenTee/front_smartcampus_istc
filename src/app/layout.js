import ThemeRegistry from '../theme/ThemeRegistry';
import './globals.css';

export const metadata = {
  title: 'Smart Campus Admin',
  description: 'Smart Campus Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
