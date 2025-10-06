/**
 * Service for handling WhatsApp interactions
 */
export class WhatsAppService {
  private static instance: WhatsAppService;
  
  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Generates a WhatsApp deep link with a pre-filled message
   * @param phoneNumber - The phone number in international format (e.g., +1234567890)
   * @param message - The message to pre-fill
   * @returns WhatsApp deep link URL
   */
  generateWhatsAppLink(phoneNumber: string, message: string): string {
    // Clean the phone number: remove any non-digit characters except the leading '+'
    const cleanedPhone = phoneNumber.replace(/[^\d]/g, '');
    
    // Remove leading + if present, as wa.me doesn't need it
    const formattedPhone = cleanedPhone.startsWith('+') 
      ? cleanedPhone.substring(1) 
      : cleanedPhone;
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  /**
   * Generates a WhatsApp message with package details and image
   * @param packageId - The package ID
   * @param clientName - The client name
   * @param imageUrl - The URL of the uploaded image
   * @returns Formatted message string
   */
  generatePackageMessage(packageId: string, clientName: string, imageUrl: string): string {
    return `Hello ${clientName},

Your package (ID: ${packageId}) has been processed and is ready for shipment.

Package Image: ${imageUrl}

Thank you for choosing our cargo service!

Best regards,
Vanguard Warehouse Team`;
  }

  /**
   * Opens WhatsApp with the generated link
   * @param phoneNumber - The phone number to send to
   * @param message - The message content
   */
  openWhatsApp(phoneNumber: string, message: string): void {
    const whatsappUrl = this.generateWhatsAppLink(phoneNumber, message);
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Validates if a phone number is in a valid international format
   * @param phoneNumber - The phone number to validate
   * @returns boolean indicating if the number is valid
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
    return phoneRegex.test(cleanedPhone);
  }
}
