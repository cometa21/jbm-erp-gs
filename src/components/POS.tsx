import React from 'react';
import { POSLayout } from './pos/POSLayout';
import { useNavigate } from 'react-router-dom';

export function POS() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full min-h-screen bg-slate-900">
      <POSLayout onBackToERP={() => navigate('/')} />
    </div>
  );
}

export default POS;
