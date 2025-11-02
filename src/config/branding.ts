/**
 * Branding Configuration
 * 
 * Centralized branding assets and company information
 * Update this file to change logos, images, and company details across the entire application
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

// ============================================================================
// IMAGE ASSETS
// ============================================================================

/**
 * Company logo - used in headers, navigation, and UI components
 */
import logoImage from '../assets/image.png';

/**
 * Login page background image
 */
import loginBackgroundImage from '../assets/Login.png';

/**
 * Alternative logo formats (if needed)
 */
import logoSvg from '../assets/logo.svg';

// ============================================================================
// COMPANY INFORMATION
// ============================================================================

/**
 * Company details used in documents, receipts, and waybills
 */
export const COMPANY_INFO = {
  name: 'VANGUARD CARGO LLC',
  address: '4700 Eisenhower Avenue ALX-E2',
  city: 'Alexandria',
  state: 'VA',
  zipCode: '22304',
  country: 'USA',
  email: 'info@vanguardcargo.co',
  supportEmail: 'support@vanguardcargo.co',
  mobile: '+233 544 197 819',
  businessLine1: '030 398 2320',
  businessLine2: '030 398 2330',
  businessLine3: '030 298 2329',
  website: 'www.vanguardcargo.co',
} as const;

/**
 * Formatted company address (single line)
 */
export const COMPANY_ADDRESS_SINGLE_LINE = `${COMPANY_INFO.address}, ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zipCode}, ${COMPANY_INFO.country}`;

/**
 * Formatted company contact info
 */
export const COMPANY_CONTACT = `Email: ${COMPANY_INFO.email} | Mobile: ${COMPANY_INFO.mobile} | Business: ${COMPANY_INFO.businessLine1}, ${COMPANY_INFO.businessLine2}, ${COMPANY_INFO.businessLine3}`;

/**
 * Formatted phone numbers for documents (compact version)
 */
export const COMPANY_PHONES_SHORT = `Mobile: ${COMPANY_INFO.mobile} | Tel: ${COMPANY_INFO.businessLine1}`;

// ============================================================================
// BRANDING ASSETS
// ============================================================================

/**
 * Primary logo for use in components
 * This is the main logo used throughout the application
 */
export const LOGO = logoImage;

/**
 * Login page background
 */
export const LOGIN_BACKGROUND = loginBackgroundImage;

/**
 * SVG logo (for scalable use cases)
 */
export const LOGO_SVG = logoSvg;

/**
 * Watermark text for documents
 */
export const WATERMARK_TEXT = 'VANGUARDCARGO';

// ============================================================================
// BRANDING COLORS
// ============================================================================

/**
 * Primary brand colors
 */
export const BRAND_COLORS = {
  primary: '#dc2626',      // Red-600
  primaryDark: '#b91c1c',  // Red-700
  primaryLight: '#ef4444', // Red-500
  secondary: '#0066cc',    // Blue
  accent: '#10b981',       // Green-500
  text: '#333333',
  textLight: '#666666',
  background: '#ffffff',
  border: '#e0e0e0',
} as const;

// ============================================================================
// DOCUMENT SETTINGS
// ============================================================================

/**
 * Settings for printed documents (waybills, receipts)
 */
export const DOCUMENT_SETTINGS = {
  logoMaxWidth: '20%',
  logoMinWidth: '100px',
  watermarkOpacity: 0.05,
  watermarkRotation: -45,
  copyrightYear: new Date().getFullYear(),
  copyrightText: `© ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.`,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Default export with all branding assets
 */
export default {
  LOGO,
  LOGIN_BACKGROUND,
  LOGO_SVG,
  COMPANY_INFO,
  COMPANY_ADDRESS_SINGLE_LINE,
  COMPANY_CONTACT,
  WATERMARK_TEXT,
  BRAND_COLORS,
  DOCUMENT_SETTINGS,
};
