import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthGuard } from '../components/providers/AuthGuard';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    replace.mockReset();
    mockUseAuth.mockReset();
  });

  it('renders children for an authenticated, verified patient', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'patient-1' },
      role: 'patient',
      loading: false,
      emailVerified: true,
    });

    render(
      <AuthGuard requiredRole="patient">
        <div>Secure area</div>
      </AuthGuard>
    );

    expect(screen.getByText('Secure area')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to the patient login page', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
      emailVerified: false,
    });

    render(
      <AuthGuard>
        <div>Secure area</div>
      </AuthGuard>
    );

    expect(replace).toHaveBeenCalledWith('/patient/login');
  });
});
