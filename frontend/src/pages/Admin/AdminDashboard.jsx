import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Loans from './Loans';
import Transactions from './Transactions';
import Users from './Users';
import Reports from './Reports';
import UserDetails from './UserDetails';
import LoanDetails from './LoanDetails';
import Settings from './Settings';
import Profile from './Profile';
import Payments from './Payments';

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/loans/:id" element={<LoanDetails />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetails />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default AdminDashboard;