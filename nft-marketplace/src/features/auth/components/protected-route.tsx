import React from 'react';
import { useAuth } from '../context/use-auth';
import { authStorage } from '../../../shared/api/auth-storage';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasToken = !!authStorage.getToken();
  const isAuthorized = isAuthenticated || hasToken;

  useEffect(() => {
    if (!isLoading && !isAuthorized && location.pathname !== '/login') {
      navigate({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  }, [isLoading, isAuthorized, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-ink py-16">
        <div className="mb-4 flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent" />
        <p className="animate-pulse text-[12px] text-muted">
          Validando sessão do colecionador...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
