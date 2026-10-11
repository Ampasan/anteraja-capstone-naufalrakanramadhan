import { useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { AuthHeader } from './components/AuthHeader';
import { LoginForm } from './components/LoginForm';
import { useAuth } from './hooks/useAuth';
import type { LoginPageProps } from './types';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const {
    formState,
    hubs,
    isPreparing,
    handleHubChange,
    handleEmailChange,
    handlePasswordChange,
    handleRememberMeChange,
    toggleShowPassword,
    handleSubmit,
  } = useAuth();

  const onSubmit = useCallback(() => {
    handleSubmit(onLoginSuccess);
  }, [handleSubmit, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-10">

      {/* ── Login Card ── */}
      <Card
        elevated
        className="w-full max-w-[460px] rounded-3xl border border-[#E2E8F0] shadow-[0_8px_32px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.06)]"
      >
        <div className="px-8 pt-8 pb-7 flex flex-col gap-6">
          {/* Branding */}
          <AuthHeader />

          {/* Form Fields */}
          <LoginForm
            formState={formState}
            hubs={hubs}
            isPreparingHubs={isPreparing}
            onHubChange={handleHubChange}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onRememberMeChange={handleRememberMeChange}
            onTogglePassword={toggleShowPassword}
            onSubmit={onSubmit}
          />
        </div>
      </Card>

      {/* ── Footer copyright ── */}
      <p className="mt-5 text-[12px] text-[#94A3B8] text-center">
        PT Tri Adi Bersama (Anteraja) © 2026
      </p>
    </div>
  );
}
