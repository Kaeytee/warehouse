# WhatsApp Image Sender Feature

This feature allows administrators to capture package images using the device camera and send them to clients via WhatsApp.

## 🎯 Overview

The WhatsApp Image Sender provides a seamless way to:
- Capture package photos using device camera
- Upload images to server storage
- Generate WhatsApp deep links with package information
- Send images directly to client phone numbers

## 📁 File Structure

```
src/app/
├── components/
│   ├── WhatsAppImageSender.tsx       # Main component
│   └── WhatsAppImageSenderDemo.tsx   # Demo/testing component
├── core/services/
│   ├── ImageUploadService.ts         # Handles image uploads
│   └── WhatsAppService.ts           # WhatsApp link generation
└── pages/IncomingRequest/
    └── ProcessIncomingRequestModal.tsx # Integrated in modal
```

## 🛠️ Components

### WhatsAppImageSender

Main component that handles the entire image capture and sending workflow.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Close handler
- `phoneNumber: string` - Client's WhatsApp number (international format)
- `packageId: string` - Package identifier
- `clientName: string` - Client's name

**Features:**
- Camera access and video preview
- Image capture from video stream
- Image preview with retake option
- Upload progress indication
- WhatsApp link generation
- Phone number validation

### WhatsAppImageSenderDemo

Demo component for testing the functionality independently.

## 🔧 Services

### ImageUploadService

Handles image upload operations.

**Methods:**
- `uploadImage(imageBlob: Blob, filename?: string): Promise<string>`
- `dataURLtoBlob(dataURL: string): Blob`

**Current Implementation:**
- Mock upload with simulated delay
- Returns placeholder URLs for development
- Ready for real backend integration

### WhatsAppService

Manages WhatsApp link generation and message formatting.

**Methods:**
- `generateWhatsAppLink(phoneNumber: string, message: string): string`
- `generatePackageMessage(packageId: string, clientName: string, imageUrl: string): string`
- `openWhatsApp(phoneNumber: string, message: string): void`
- `validatePhoneNumber(phoneNumber: string): boolean`

## 🚀 Usage

### In ProcessIncomingRequestModal

The feature is integrated into the package processing workflow:

1. Add `phoneNumber` to the request object
2. The WhatsApp button appears automatically if phone number is present
3. Click "Take & Send Photo" to open the camera modal

```tsx
// Example request object
const request = {
  id: "REQ123",
  client: "John Doe",
  phoneNumber: "+1234567890", // Required for WhatsApp feature
  weight: 2.5
};
```

### Standalone Usage

```tsx
import WhatsAppImageSender from './components/WhatsAppImageSender';

function MyComponent() {
  const [showSender, setShowSender] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowSender(true)}>
        Send Package Image
      </button>
      
      <WhatsAppImageSender
        isOpen={showSender}
        onClose={() => setShowSender(false)}
        phoneNumber="+1234567890"
        packageId="PKG123"
        clientName="John Doe"
      />
    </>
  );
}
```

## 📱 Camera Requirements

### Browser Compatibility
- Chrome 53+ (desktop/mobile)
- Firefox 36+ (desktop/mobile)
- Safari 11+ (desktop/mobile)
- Edge 79+

### Security Requirements
- **HTTPS required** in production
- Camera permissions must be granted
- Secure context (localhost works for development)

### Mobile Considerations
- Uses `facingMode: 'environment'` for back camera
- Responsive design for various screen sizes
- Touch-friendly interface

## 🔗 WhatsApp Integration

### Deep Link Format
```
https://wa.me/{phone_number}?text={encoded_message}
```

### Message Template
```
Hello {clientName},

Your package (ID: {packageId}) has been processed and is ready for shipment.

Package Image: {imageUrl}

Thank you for choosing our cargo service!

Best regards,
Vanguard Warehouse Team
```

### Phone Number Format
- International format required: `+1234567890`
- No spaces, dashes, or special characters
- Automatic validation included

## 🔧 Backend Integration

### Image Upload Endpoint

Create an endpoint to handle image uploads:

```typescript
// Example Express.js endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  // Handle file upload
  const imageUrl = `https://your-domain.com/images/${req.file.filename}`;
  res.json({ url: imageUrl });
});
```

### Update ImageUploadService

Replace the mock implementation:

```typescript
async uploadImage(imageBlob: Blob, filename: string = 'image.jpg'): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageBlob, filename);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}
```

## 🎨 Styling

The component uses Tailwind CSS classes for styling:

- Responsive design with `max-w-2xl` container
- Green color scheme for WhatsApp branding
- Loading states with spinner animation
- Error states with red color scheme
- Camera interface with overlay controls

## ⚠️ Limitations & Considerations

### Current Limitations
1. **Mock Upload**: Images aren't actually uploaded (development mode)
2. **WhatsApp Web**: Opens WhatsApp web/app, doesn't send automatically
3. **Camera Access**: Requires user permission
4. **HTTPS Only**: Camera API requires secure context

### Security Considerations
1. Validate phone numbers server-side
2. Implement file type restrictions for uploads
3. Add rate limiting for upload endpoints
4. Sanitize uploaded images
5. Implement proper authentication

### Performance Considerations
1. Compress images before upload
2. Implement retry logic for failed uploads
3. Add progress indicators for large images
4. Consider image resizing for mobile

## 🧪 Testing

### Manual Testing
1. Use the `WhatsAppImageSenderDemo` component
2. Test with various phone number formats
3. Verify camera access on different devices
4. Test error handling scenarios

### Test Scenarios
- [ ] Valid phone number with successful image capture
- [ ] Invalid phone number validation
- [ ] Camera permission denied
- [ ] Image upload failure
- [ ] Network connectivity issues
- [ ] Mobile device testing

## 🔮 Future Enhancements

1. **Batch Image Sending**: Send multiple images at once
2. **Image Editing**: Basic crop/rotate functionality
3. **Template Messages**: Customizable message templates
4. **Delivery Tracking**: Track if WhatsApp message was opened
5. **Integration**: Direct WhatsApp Business API integration
6. **Offline Support**: Queue images when offline
7. **Image Gallery**: View previously sent images

## 📞 Support

For issues or questions about the WhatsApp Image Sender feature:
1. Check browser console for error messages
2. Verify camera permissions are granted
3. Ensure HTTPS is enabled in production
4. Test with valid international phone numbers

## 🔄 Version History

- **v1.0.0**: Initial implementation with camera capture and WhatsApp integration
- **v1.0.1**: Added phone number validation and error handling
- **v1.0.2**: Improved mobile responsiveness and camera controls
