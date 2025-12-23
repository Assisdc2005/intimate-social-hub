import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackViewContent } from '@/lib/metaPixel';

/**
 * Hook para rastreamento automático de PageView em cada navegação
 * e ViewContent para páginas internas relevantes
 */
export const useMetaPixel = () => {
  const location = useLocation();

  useEffect(() => {
    // Dispara PageView em cada mudança de rota
    trackPageView();

    // Dispara ViewContent para páginas internas específicas
    const path = location.pathname;
    
    // Páginas de perfil
    if (path.startsWith('/profile/view/')) {
      const userId = path.split('/').pop();
      trackViewContent({
        content_name: 'User Profile',
        content_category: 'profile',
        content_ids: userId ? [userId] : undefined,
        content_type: 'profile',
      });
    }
    
    // Feed/Home
    else if (path === '/home' || path === '/') {
      trackViewContent({
        content_name: 'Feed',
        content_category: 'feed',
        content_type: 'page',
      });
    }
    
    // Discover
    else if (path === '/discover') {
      trackViewContent({
        content_name: 'Discover',
        content_category: 'discovery',
        content_type: 'page',
      });
    }
    
    // Messages
    else if (path === '/messages') {
      trackViewContent({
        content_name: 'Messages',
        content_category: 'communication',
        content_type: 'page',
      });
    }
    
    // Premium/Plans
    else if (path === '/premium' || path === '/plans') {
      trackViewContent({
        content_name: 'Premium Plans',
        content_category: 'subscription',
        content_type: 'product',
        value: 0,
      });
    }
    
    // Live
    else if (path === '/live') {
      trackViewContent({
        content_name: 'Live Streams',
        content_category: 'live',
        content_type: 'page',
      });
    }

  }, [location.pathname]);

  return null;
};

export default useMetaPixel;
