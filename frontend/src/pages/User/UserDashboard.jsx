import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import MyLoans from './MyLoans';
import Transactions from './Transactions';
import Profile from './Profile';
import Settings from './Settings';
import LoanDetails from './LoanDetails';

function UserDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loans" element={<MyLoans />} />
        <Route path="/loans/:id" element={<LoanDetails />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default UserDashboard;