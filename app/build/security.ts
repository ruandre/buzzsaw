import type { Plugin } from 'vite'

// HTTP security policy for Vite dev/preview headers and static HTML meta tags

// Denied permissions-policy features. Omits autoplay, clipboard-write, and cross-origin-isolated
const DENIED_FEATURES = [
  'accelerometer',
  'ambient-light-sensor',
  'attribution-reporting',
  'battery',
  'bluetooth',
  'browsing-topics',
  'camera',
  'clipboard-read',
  'compute-pressure',
  'display-capture',
  'encrypted-media',
  'fullscreen',
  'gamepad',
  'geolocation',
  'gyroscope',
  'hid',
  'identity-credentials-get',
  'idle-detection',
  'interest-cohort',
  'local-fonts',
  'magnetometer',
  'microphone',
  'midi',
  'otp-credentials',
  'payment',
  'picture-in-picture',
  'publickey-credentials-create',
  'publickey-credentials-get',
  'screen-wake-lock',
  'serial',
  'storage-access',
  'usb',
  'window-management',
  'xr-spatial-tracking',
]

const REFERRER_POLICY = 'no-referrer'

export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': REFERRER_POLICY,
  'Permissions-Policy': DENIED_FEATURES.map(feature => `${feature}=()`).join(', '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// CSP directives; allows blob: for WAV export and unsafe-inline for Vue transitions
const CSP_DIRECTIVES = [
  'default-src \'self\'',
  'script-src \'self\'',
  'style-src \'self\' \'unsafe-inline\'',
  'img-src \'self\' data: blob:',
  'font-src \'self\'',
  'media-src \'self\' blob:',
  'connect-src \'self\' blob:',
  'worker-src \'self\' blob:',
  'object-src \'none\'',
  'base-uri \'none\'',
  'form-action \'none\'',
]

export const contentSecurityPolicy = [...CSP_DIRECTIVES, 'frame-ancestors \'self\''].join('; ')

// frame-ancestors is omitted because CSP meta tags do not support it
const metaContentSecurityPolicy = CSP_DIRECTIVES.join('; ')

/** Injects CSP and referrer meta tags into production HTML build */
export function documentSecurityPolicies(): Plugin {
  return {
    name: 'buzzsaw:security-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', 'content': metaContentSecurityPolicy },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'referrer', content: REFERRER_POLICY },
          injectTo: 'head-prepend',
        },
      ],
    },
  }
}
