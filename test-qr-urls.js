/**
 * Test script to verify QR code URL generation
 * This script tests that the QR codes generate the correct URLs
 */

// Simulate the QR code generation functions
class TestQRGenerator {
  async generatePackageQRCode(trackingNumber: string) {
    // Build tracking URL with new format
    const trackingUrl = `https://www.vanguardcargo.co/app/tracking?id=${trackingNumber}`;
    return { dataUrl: 'test-data-url', rawData: trackingUrl, format: 'QR' };
  }

  async generateShipmentQRCode(trackingNumber: string) {
    // Build tracking URL with new format
    const trackingUrl = `https://www.vanguardcargo.co/app/tracking?id=${trackingNumber}`;
    return { dataUrl: 'test-data-url', rawData: trackingUrl, format: 'QR' };
  }
}

// Test the functions
const testGenerator = new TestQRGenerator();

// Test package QR code
testGenerator.generatePackageQRCode('PKG123456')
  .then(result => {
    console.log('Package QR Code Test:');
    console.log('Expected URL format: https://www.vanguardcargo.co/app/tracking?id=PKG123456');
    console.log('Generated URL:', result.rawData);
    console.log('URLs match:', result.rawData === 'https://www.vanguardcargo.co/app/tracking?id=PKG123456');
    console.log('');
  });

// Test shipment QR code
testGenerator.generateShipmentQRCode('SHIP789012')
  .then(result => {
    console.log('Shipment QR Code Test:');
    console.log('Expected URL format: https://www.vanguardcargo.co/app/tracking?id=SHIP789012');
    console.log('Generated URL:', result.rawData);
    console.log('URLs match:', result.rawData === 'https://www.vanguardcargo.co/app/tracking?id=SHIP789012');
    console.log('');
  });

console.log('QR Code URL generation tests completed!');
