// barcodeUtils.ts
// Utility functions for barcode generation in Vanguard Cargo
// Clean code, OOP, and best practices applied
// This file enables barcode generation for tracking URLs for each package

import JsBarcode from 'jsbarcode';

/**
 * Generates a barcode image as a PNG DataURL encoding the tracking URL for a package.
 * @param packageId - The unique package/shipment ID
 * @returns PNG DataURL of the barcode
 */
export function generateTrackingBarcode(packageId: string): string {
  // Construct the tracking URL to encode in the barcode
  const trackingUrl = `https://www.vanguardcargo.org/app/tracl/${packageId}`;
  // Create a canvas for JsBarcode to render into
  const canvas = document.createElement('canvas');
  // Generate the barcode using CODE128 format
  JsBarcode(canvas, trackingUrl, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: false,
    margin: 0,
    background: '#fff',
    lineColor: '#222',
  });
  // Convert the canvas to a PNG DataURL
  return canvas.toDataURL('image/png');
}

/**
 * Example integration: Generate barcode and attach it to package info before sending to backend.
 *
 * import { generateTrackingBarcode } from '../utils/barcodeUtils';
 *
 * function createPackageOnSubmit(packageInfo: Omit<PackageInfo, 'barcodeImage'>) {
 *   const barcodeImage = generateTrackingBarcode(packageInfo.packageId);
 *   const packageData = { ...packageInfo, barcodeImage };
 *   // Now POST packageData to your backend API
 * }
 */

// You can also extend this utility for QR codes or other barcode formats as needed.
