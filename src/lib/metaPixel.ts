/**
 * Meta Pixel (Facebook Ads) Integration
 * Pixel ID: 753894800404407
 * 
 * Este módulo gerencia todos os eventos de rastreamento do Meta Pixel
 * para a plataforma Sensual Connect.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '753894800404407';

// Verificar se o pixel está carregado
const isPixelLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

// Track evento genérico
const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isPixelLoaded()) {
    console.warn('[Meta Pixel] Pixel não carregado');
    return;
  }
  
  try {
    if (params) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
    console.log(`[Meta Pixel] Evento "${eventName}" disparado`, params || '');
  } catch (error) {
    console.error('[Meta Pixel] Erro ao disparar evento:', error);
  }
};

// Track evento customizado
const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isPixelLoaded()) {
    console.warn('[Meta Pixel] Pixel não carregado');
    return;
  }
  
  try {
    if (params) {
      window.fbq('trackCustom', eventName, params);
    } else {
      window.fbq('trackCustom', eventName);
    }
    console.log(`[Meta Pixel] Evento customizado "${eventName}" disparado`, params || '');
  } catch (error) {
    console.error('[Meta Pixel] Erro ao disparar evento customizado:', error);
  }
};

// ============================================
// EVENTOS PADRÃO DO META PIXEL
// ============================================

/**
 * PageView - Disparado automaticamente em cada navegação
 */
export const trackPageView = () => {
  trackEvent('PageView');
};

/**
 * ViewContent - Quando usuário visualiza perfis ou páginas internas
 */
export const trackViewContent = (params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('ViewContent', {
    content_type: 'profile',
    currency: 'BRL',
    ...params,
  });
};

/**
 * Lead - Quando usuário inicia o cadastro (preencheu formulário inicial)
 */
export const trackLead = (params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('Lead', {
    content_category: 'signup',
    currency: 'BRL',
    ...params,
  });
};

/**
 * CompleteRegistration - Quando usuário conclui o cadastro
 */
export const trackCompleteRegistration = (params?: {
  content_name?: string;
  status?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('CompleteRegistration', {
    status: 'completed',
    currency: 'BRL',
    ...params,
  });
};

/**
 * AddToWishlist - Quando usuário curte/interage com perfis
 */
export const trackAddToWishlist = (params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) => {
  trackEvent('AddToWishlist', {
    content_category: 'profile_interaction',
    currency: 'BRL',
    ...params,
  });
};

/**
 * Contact - Quando usuário inicia conversa/mensagem
 */
export const trackContact = (params?: {
  content_name?: string;
  content_category?: string;
}) => {
  trackEvent('Contact', {
    content_category: 'message',
    ...params,
  });
};

/**
 * InitiateCheckout - Quando usuário inicia processo de assinatura
 */
export const trackInitiateCheckout = (params?: {
  content_name?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
}) => {
  trackEvent('InitiateCheckout', {
    currency: 'BRL',
    ...params,
  });
};

/**
 * Purchase - Quando usuário conclui assinatura/compra
 */
export const trackPurchase = (params: {
  value: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
}) => {
  trackEvent('Purchase', {
    currency: 'BRL',
    ...params,
  });
};

/**
 * Subscribe - Quando usuário se inscreve no plano premium
 */
export const trackSubscribe = (params?: {
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}) => {
  trackEvent('Subscribe', {
    currency: 'BRL',
    ...params,
  });
};

/**
 * Search - Quando usuário realiza busca
 */
export const trackSearch = (params?: {
  search_string?: string;
  content_category?: string;
  content_ids?: string[];
}) => {
  trackEvent('Search', params);
};

// ============================================
// EVENTOS CUSTOMIZADOS
// ============================================

/**
 * ProfileLike - Quando usuário curte um perfil
 */
export const trackProfileLike = (params?: {
  profile_id?: string;
  profile_name?: string;
  reaction_type?: string;
}) => {
  trackCustomEvent('ProfileLike', params);
};

/**
 * ProfileView - Quando usuário visualiza um perfil específico
 */
export const trackProfileView = (params?: {
  profile_id?: string;
  profile_name?: string;
  profile_gender?: string;
}) => {
  trackCustomEvent('ProfileView', params);
};

/**
 * MessageSent - Quando usuário envia uma mensagem
 */
export const trackMessageSent = (params?: {
  recipient_id?: string;
  is_first_message?: boolean;
}) => {
  trackCustomEvent('MessageSent', params);
};

/**
 * PhotoViewed - Quando usuário visualiza uma foto
 */
export const trackPhotoViewed = (params?: {
  photo_id?: string;
  profile_id?: string;
}) => {
  trackCustomEvent('PhotoViewed', params);
};

/**
 * VideoViewed - Quando usuário visualiza um vídeo
 */
export const trackVideoViewed = (params?: {
  video_id?: string;
  profile_id?: string;
  duration?: number;
}) => {
  trackCustomEvent('VideoViewed', params);
};

/**
 * LiveJoined - Quando usuário entra em uma live
 */
export const trackLiveJoined = (params?: {
  live_id?: string;
  host_id?: string;
}) => {
  trackCustomEvent('LiveJoined', params);
};

/**
 * PremiumPageView - Quando usuário visualiza página de planos
 */
export const trackPremiumPageView = () => {
  trackCustomEvent('PremiumPageView', {
    page: 'premium_plans',
  });
};

/**
 * FilterApplied - Quando usuário aplica filtros de busca
 */
export const trackFilterApplied = (params?: {
  filter_type?: string;
  filter_value?: string;
}) => {
  trackCustomEvent('FilterApplied', params);
};

// Export do Pixel ID para referência
export const META_PIXEL_ID = PIXEL_ID;
