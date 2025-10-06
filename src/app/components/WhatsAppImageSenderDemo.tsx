import React, { useState } from 'react';
import WhatsAppImageSender from './WhatsAppImageSender';

/**
 * Demo component for testing the WhatsApp Image Sender functionality
 * This can be used for testing and demonstration purposes
 */
const WhatsAppImageSenderDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [packageId, setPackageId] = useState('PKG123456789');
  const [clientName, setClientName] = useState('John Doe');

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">WhatsApp Image Sender Demo</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="+1234567890"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package ID
          </label>
          <input
            type="text"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="PKG123456789"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="John Doe"
          />
        </div>
      </div>
      
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
      >
        📷 Test WhatsApp Image Sender
      </button>
      
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Camera access requires HTTPS in production</li>
          <li>• Image upload currently uses mock implementation</li>
          <li>• WhatsApp link opens in new tab</li>
          <li>• Test with a valid international phone number</li>
        </ul>
      </div>
      
      <WhatsAppImageSender
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        phoneNumber={phoneNumber}
        packageId={packageId}
        clientName={clientName}
      />
    </div>
  );
};

export default WhatsAppImageSenderDemo;
