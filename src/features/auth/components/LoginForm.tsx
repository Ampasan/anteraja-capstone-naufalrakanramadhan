import { Briefcase, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { HubSelect } from './HubSelect';
import type { LoginFormState } from '../types';

interface LoginFormProps {
  formState: LoginFormState;
  onHubChange: (hubId: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onRememberMeChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
}

export function LoginForm({
  formState,
  onHubChange,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  const { hubId, email, password, rememberMe, showPassword, isLoading, errorMessage } =
    formState;

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-5">

      {/* ── Field 1: Stasiun Layanan / Hub ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[#374151]">
          Stasiun Layanan / Hub
        </label>
        <HubSelect value={hubId} onChange={onHubChange} />
      </div>

      {/* ── Field 2: Email ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-[13px] font-semibold text-[#374151]">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="email@anteraja.id"
          leftIcon={<Briefcase size={16} />}
          className="h-10"
        />
      </div>

      {/* ── Field 3: Kata Sandi ── */}
      <div className="flex flex-col gap-1.5">
        {/* Label row: "Kata Sandi" + "Lupa kata sandi?" */}
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-[13px] font-semibold text-[#374151]">
            Kata Sandi
          </label>
          <button
            type="button"
            className="text-[12px] font-medium text-[#99004C] hover:text-[#C91076] transition-colors duration-150 cursor-pointer"
          >
            Lupa kata sandi?
          </button>
        </div>

        {/* Input dengan toggle show/hide */}
        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Masukkan kata sandi"
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="text-[#94A3B8] hover:text-[#64748B] transition-colors duration-150 cursor-pointer focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          className="h-10"
        />
      </div>

      {/* ── Checkbox: Ingat saya ── */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
        {/* Hidden native checkbox */}
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => onRememberMeChange(e.target.checked)}
          className="sr-only"
        />
        {/* Custom checkbox visual */}
        <span
          className={`
            w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center
            transition-all duration-150 flex-shrink-0
            ${
              rememberMe
                ? 'bg-[#99004C] border-[#99004C]'
                : 'bg-white border-[#CBD5E1] group-hover:border-[#99004C]'
            }
          `}
          aria-hidden="true"
        >
          {rememberMe && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="text-[13px] text-[#475569] group-hover:text-[#0F172A] transition-colors duration-150">
          Ingat saya di perangkat ini
        </span>
      </label>

      {/* ── Error message ── */}
      {errorMessage && (
        <p
          role="alert"
          className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 -mt-1"
        >
          {errorMessage}
        </p>
      )}

      {/* ── Tombol Masuk ── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        className="mt-1 h-11 text-[15px] font-bold bg-[#99004C] border-[#99004C] hover:bg-[#C91076] hover:border-[#C91076] active:bg-[#7A003D]"
      >
        Masuk ke Panel Dispatch
        {!isLoading && <ArrowRight size={17} className="ml-1" />}
      </Button>
    </form>
  );
}
