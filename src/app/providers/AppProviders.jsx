import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { VisitTracker } from '../../components/analytics/VisitTracker.jsx';
import { GlobalWatermark } from '../../components/global/GlobalWatermark.jsx';
import { AuthProvider } from '../../features/auth/context/AuthContext.jsx';
import { NotificationProvider } from '../../features/notifications/context/NotificationContext.jsx';
import { AppRouter } from '../router/AppRouter.jsx';

export const AppProviders = () => {
  const watermarkText = import.meta.env.VITE_WATERMARK_TEXT || '';
  const watermarkTagline = import.meta.env.VITE_WATERMARK_TAGLINE || '';
  const watermarkPosition = import.meta.env.VITE_WATERMARK_POSITION || 'bottom-right';
  const watermarkOpacity = Number(import.meta.env.VITE_WATERMARK_OPACITY || 0.08);
  const watermarkColor = import.meta.env.VITE_WATERMARK_COLOR || '#7a8b84';
  const watermarkImageUrl =
    import.meta.env.VITE_WATERMARK_IMAGE_URL ||
    'https://i.ibb.co.com/wFxJ4MSV/Chat-GPT-Image-Aug-15-2025-01-06-52-AM.png';
  const watermarkLinkUrl =
    import.meta.env.VITE_WATERMARK_LINK_URL || 'https://hridoy-portfilio.vercel.app/';

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <VisitTracker />
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                border: '1px solid #dbe1d7',
                borderRadius: '12px',
                color: '#1b2c2c',
                boxShadow: '0 18px 36px rgba(20, 39, 39, 0.14)',
              },
              success: {
                iconTheme: {
                  primary: '#2a7d5f',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#c13232',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          <GlobalWatermark
            brandText={watermarkText}
            tagline={watermarkTagline}
            position={watermarkPosition}
            opacity={watermarkOpacity}
            color={watermarkColor}
            imageUrl={watermarkImageUrl}
            linkUrl={watermarkLinkUrl}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
