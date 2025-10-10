/**
 * Barcode and QR Code Generator Utility
 * 
 * Generates barcodes and QR codes for packages and shipments
 * Provides consistent code generation throughout the application
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Barcode generation options
 * Configuration for barcode appearance
 */
export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
}

/**
 * QR Code generation options
 * Configuration for QR code appearance
 */
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generated code result
 * Contains both data URL and raw data
 */
export interface GeneratedCode {
  dataUrl: string;
  rawData: string;
  format: string;
}

// ============================================================================
// BARCODE AND QR CODE GENERATOR CLASS
// ============================================================================

class BarcodeQRGenerator {
  /**
   * Default barcode options
   * Standard configuration for warehouse barcodes
   */
  private defaultBarcodeOptions: BarcodeOptions = {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 14,
    margin: 10
  };

  /**
   * Default QR code options
   * Standard configuration for warehouse QR codes
   */
  private defaultQRCodeOptions: QRCodeOptions = {
    width: 200,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };

  /**
   * Generate barcode for tracking number
   * Creates barcode image as data URL
   */
  async generateBarcode(
    trackingNumber: string,
    options?: BarcodeOptions
  ): Promise<GeneratedCode> {
    try {
      // Merge custom options with defaults
      const opts = { ...this.defaultBarcodeOptions, ...options };

      // Create canvas element
      const canvas = document.createElement('canvas');

      // Generate barcode on canvas
      JsBarcode(canvas, trackingNumber, {
        format: opts.format,
        width: opts.width,
        height: opts.height,
        displayValue: opts.displayValue,
        fontSize: opts.fontSize,
        margin: opts.margin
      });

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');

      return {
        dataUrl,
        rawData: trackingNumber,
        format: opts.format || 'CODE128'
      };

    } catch (error) {
      throw new Error('Barcode generation failed');
    }
  }

  /**
   * Generate QR code with tracking URL
   * Creates QR code that links to tracking page
   */
  async generateQRCode(
    data: string,
    options?: QRCodeOptions
  ): Promise<GeneratedCode> {
    try {
      // Merge custom options with defaults
      const opts = { ...this.defaultQRCodeOptions, ...options };

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(data, {
        width: opts.width,
        margin: opts.margin,
        errorCorrectionLevel: opts.errorCorrectionLevel,
        color: opts.color
      });

      return {
        dataUrl,
        rawData: data,
        format: 'QR'
      };

    } catch (error) {
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate package tracking QR code
   * Creates QR code linking to public tracking page
   */
  async generatePackageQRCode(
    trackingNumber: string
  ): Promise<GeneratedCode> {
    try {
      // Build tracking URL with new format
      const trackingUrl = `https://www.vanguardcargo.co/app/tracking?id=${trackingNumber}`;

      // Generate QR code with tracking URL
      return await this.generateQRCode(trackingUrl);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate shipment tracking QR code
   * Creates QR code linking to shipment tracking page
   */
  async generateShipmentQRCode(
    trackingNumber: string
  ): Promise<GeneratedCode> {
    try {
      // Build tracking URL with new format
      const trackingUrl = `https://www.vanguardcargo.co/app/tracking?id=${trackingNumber}`;

      // Generate QR code with tracking URL
      return await this.generateQRCode(trackingUrl);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate complete package code set
   * Creates both barcode and QR code for package
   */
  async generatePackageCodes(
    trackingNumber: string
  ): Promise<{
    barcode: GeneratedCode;
    qrCode: GeneratedCode;
  }> {
    try {
      // Generate barcode
      const barcode = await this.generateBarcode(trackingNumber);

      // Generate QR code
      const qrCode = await this.generatePackageQRCode(trackingNumber);

      return { barcode, qrCode };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate complete shipment code set
   * Creates both barcode and QR code for shipment
   */
  async generateShipmentCodes(
    trackingNumber: string
  ): Promise<{
    barcode: GeneratedCode;
    qrCode: GeneratedCode;
  }> {
    try {
      // Generate barcode
      const barcode = await this.generateBarcode(trackingNumber);

      // Generate QR code
      const qrCode = await this.generateShipmentQRCode(trackingNumber);

      return { barcode, qrCode };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate barcode as SVG
   * Creates barcode in SVG format for scalable printing
   */
  generateBarcodeSVG(
    trackingNumber: string,
    options?: BarcodeOptions
  ): string {
    try {
      // Merge custom options with defaults
      const opts = { ...this.defaultBarcodeOptions, ...options };

      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Generate barcode on SVG
      JsBarcode(svg, trackingNumber, {
        format: opts.format,
        width: opts.width,
        height: opts.height,
        displayValue: opts.displayValue,
        fontSize: opts.fontSize,
        margin: opts.margin
      });

      // Return SVG as string
      return svg.outerHTML;

    } catch (error) {
      throw new Error('Barcode SVG generation failed');
    }
  }

  /**
   * Generate QR code as SVG
   * Creates QR code in SVG format for scalable printing
   */
  async generateQRCodeSVG(
    data: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      // Merge custom options with defaults
      const opts = { ...this.defaultQRCodeOptions, ...options };

      // Generate QR code as SVG string
      const svgString = await QRCode.toString(data, {
        type: 'svg',
        width: opts.width,
        margin: opts.margin,
        errorCorrectionLevel: opts.errorCorrectionLevel,
        color: opts.color
      });

      return svgString;

    } catch (error) {
      throw new Error('QR code SVG generation failed');
    }
  }

  /**
   * Download barcode as image
   * Triggers browser download of barcode
   */
  downloadBarcode(
    trackingNumber: string,
    filename?: string
  ): void {
    try {
      // Generate barcode
      this.generateBarcode(trackingNumber).then(barcode => {
        // Create download link
        const link = document.createElement('a');
        link.download = filename || `barcode-${trackingNumber}.png`;
        link.href = barcode.dataUrl;
        link.click();
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Download QR code as image
   * Triggers browser download of QR code
   */
  downloadQRCode(
    data: string,
    filename?: string
  ): void {
    try {
      // Generate QR code
      this.generateQRCode(data).then(qrCode => {
        // Create download link
        const link = document.createElement('a');
        link.download = filename || `qrcode-${Date.now()}.png`;
        link.href = qrCode.dataUrl;
        link.click();
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Print barcode
   * Opens print dialog with barcode
   */
  printBarcode(
    trackingNumber: string
  ): void {
    try {
      this.generateBarcode(trackingNumber).then(barcode => {
        // Create print window
        const printWindow = window.open('', '', 'width=600,height=400');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print Barcode - ${trackingNumber}</title>
                <style>
                  body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                  }
                  .barcode-container {
                    text-align: center;
                  }
                  img {
                    max-width: 100%;
                  }
                  h2 {
                    margin-top: 10px;
                  }
                </style>
              </head>
              <body>
                <div class="barcode-container">
                  <img src="${barcode.dataUrl}" alt="Barcode" />
                  <h2>${trackingNumber}</h2>
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    window.close();
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Print QR code
   * Opens print dialog with QR code
   */
  printQRCode(
    data: string,
    label?: string
  ): void {
    try {
      this.generateQRCode(data).then(qrCode => {
        // Create print window
        const printWindow = window.open('', '', 'width=600,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print QR Code</title>
                <style>
                  body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                  }
                  .qr-container {
                    text-align: center;
                  }
                  img {
                    max-width: 100%;
                  }
                  h2 {
                    margin-top: 10px;
                  }
                </style>
              </head>
              <body>
                <div class="qr-container">
                  <img src="${qrCode.dataUrl}" alt="QR Code" />
                  ${label ? `<h2>${label}</h2>` : ''}
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    window.close();
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      });

    } catch (error) {
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

// Export singleton instance for use throughout the application
export const barcodeQRGenerator = new BarcodeQRGenerator();
export default barcodeQRGenerator;
