import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { FarmerNav } from './FarmerNav';

export const FarmerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col pb-20 md:pb-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <FarmerNav />
        <main className="mt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
