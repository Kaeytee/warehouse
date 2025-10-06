/**
 * About Page
 *
 * This page displays information about Vanguard Cargo and the application.
 * Follows clean code, OOP, and best practices.
 */
import React from 'react';

/**
 * About component for Vanguard Cargo application.
 * @returns {React.ReactElement} About page
 */
const About: React.FC = () => (
  <div className="py-10 px-6 max-w-3xl mx-auto">
    <h1 className="text-3xl font-bold text-red-700 mb-4">About Vanguard Cargo</h1>
    <p className="text-gray-700 text-lg mb-2">
      Vanguard Cargo is a modern cargo management platform designed to streamline shipment, warehouse, and client operations. Our mission is to deliver seamless, transparent, and efficient cargo services for businesses of all sizes.
    </p>
    <p className="text-gray-600 mb-2">
      This application enables you to track shipments, manage inventory, and analyze cargo data with ease. Built with best practices in React and TypeScript, it is secure, scalable, and user-friendly.
    </p>
    <p className="text-gray-500 mt-6 text-sm">&copy; 2025 Vanguard Cargo. All rights reserved.</p>
  </div>
);

export default About;
