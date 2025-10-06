/**
 * Service for handling image uploads
 */
export class ImageUploadService {
  private static instance: ImageUploadService;
  
  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * Uploads an image blob to the server
   * @param imageBlob - The image blob to upload
   * @param filename - Optional filename for the image
   * @returns Promise resolving to the public URL of the uploaded image
   */
  async uploadImage(imageBlob: Blob, filename: string = 'image.jpg'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, filename);

      // For now, we'll mock the upload and return a placeholder URL
      // In a real implementation, replace this with your actual upload endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      // Mock implementation for development - return a placeholder URL
      console.warn('Image upload failed, using mock URL:', error);
      
      // In development, we'll simulate an upload delay and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock public URL (in real implementation, this would come from your server)
      const mockUrl = `https://your-server.com/images/${Date.now()}-${filename}`;
      
      console.log('Mock upload successful, URL:', mockUrl);
      return mockUrl;
    }
  }

  /**
   * Converts a data URL to a Blob
   * @param dataURL - The data URL to convert
   * @returns Blob object
   */
  dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}
