import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-surface">
        <TopBar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
