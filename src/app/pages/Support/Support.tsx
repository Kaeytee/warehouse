/**
 * Support Page
 *
 * This page provides support resources and contact information for users.
 * Follows clean code, OOP, and best practices.
 */
import React from 'react';

/**
 * Support component for Vanguard Cargo application.
 * @returns {React.ReactElement} Support page
 */
const Support: React.FC = () => {
  /**
   * Handles complaint form submission
   * @param e Form event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement complaint submission logic here (e.g., POST to API)
    alert('Complaint submitted. Our team will review it shortly.');
  };

  return (
    <div className="py-10 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-red-700 mb-4">Complaints & Support Center</h1>
      <p className="text-gray-700 text-lg mb-6">
        Submit complaints or requests directly to the superadmin, developers, or manager. Please provide clear details so we can assist you efficiently.
      </p>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
          <select id="recipient" name="recipient" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
            <option value="superadmin">Superadmin</option>
            <option value="developers">Developers</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="complaint" className="block text-sm font-medium text-gray-700 mb-1">Complaint or Request</label>
          <textarea id="complaint" name="complaint" rows={5} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" placeholder="Describe your issue or request in detail..." required></textarea>
        </div>
        <button type="submit" className="px-6 py-3 bg-red-600 text-white font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Submit Complaint
        </button>
      </form>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Complaint History</h2>
        <p className="text-gray-500">Your previous complaints will appear here soon.</p>
      </div>
    </div>
  );
};

export default Support;
