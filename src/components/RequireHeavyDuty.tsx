import React from 'react';
import { Navigate } from 'react-router-dom';
import { useConnectionStore } from '../stores/connectionStore';

interface RequireHeavyDutyProps {
  children: React.ReactNode;
}

export const RequireHeavyDuty: React.FC<RequireHeavyDutyProps> = ({ children }) => {
  const vehicleType = useConnectionStore((s) => s.vehicleType);

  if (vehicleType !== 'HDV') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

