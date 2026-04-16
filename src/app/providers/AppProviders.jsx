import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { GlobalWatermark } from '../../components/global/GlobalWatermark.jsx';
import { AuthProvider } from '../../features/auth/context/AuthContext.jsx';
import { NotificationProvider } from '../../features/notifications/context/NotificationContext.jsx';
import { AppRouter } from '../router/AppRouter.jsx';

export const AppProviders = () => {
  const watermarkText = import.meta.env.VITE_WATERMARK_TEXT || import.meta.env.VITE_APP_NAME;
  const watermarkTagline = import.meta.env.VITE_WATERMARK_TAGLINE || 'Donate blood save lives';
  const watermarkPosition = import.meta.env.VITE_WATERMARK_POSITION || 'bottom-right';
  const watermarkOpacity = Number(import.meta.env.VITE_WATERMARK_OPACITY || 0.08);
  const watermarkColor = import.meta.env.VITE_WATERMARK_COLOR || '#7a8b84';

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <GlobalWatermark
            brandText={watermarkText}
            tagline={watermarkTagline}
            position={watermarkPosition}
            opacity={watermarkOpacity}
            color={watermarkColor}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
