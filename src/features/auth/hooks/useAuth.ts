import { useState, useCallback } from 'react';
import type { LoginFormState } from '../types';
import { ACTIVE_HUB } from '../../../data/mockHubs';

const INITIAL_STATE: LoginFormState = {
  hubId: ACTIVE_HUB.id,
  email: 'siti.admin@anteraja.id',
  password: 'Anteraja2026!',
  rememberMe: false,
  showPassword: false,
  isLoading: false,
  errorMessage: null,
};

interface UseAuthReturn {
  formState: LoginFormState;
  handleHubChange: (hubId: string) => void;
  handleEmailChange: (email: string) => void;
  handlePasswordChange: (password: string) => void;
  handleRememberMeChange: (checked: boolean) => void;
  toggleShowPassword: () => void;
  handleSubmit: (onLoginSuccess: () => void) => void;
}

export function useAuth(): UseAuthReturn {
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_STATE);

  const handleHubChange = useCallback((hubId: string) => {
    setFormState((prev) => ({ ...prev, hubId, errorMessage: null }));
  }, []);

  const handleEmailChange = useCallback((email: string) => {
    setFormState((prev) => ({ ...prev, email, errorMessage: null }));
  }, []);

  const handlePasswordChange = useCallback((password: string) => {
    setFormState((prev) => ({ ...prev, password, errorMessage: null }));
  }, []);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setFormState((prev) => ({ ...prev, rememberMe: checked }));
  }, []);

  const toggleShowPassword = useCallback(() => {
    setFormState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  }, []);

  const handleSubmit = useCallback(
    (onLoginSuccess: () => void) => {
      const { email, password, hubId } = formState;

      // Validasi dasar
      if (!email.trim() || !password.trim() || !hubId) {
        setFormState((prev) => ({
          ...prev,
          errorMessage: 'Semua field wajib diisi.',
        }));
        return;
      }

      // Set loading
      setFormState((prev) => ({
        ...prev,
        isLoading: true,
        errorMessage: null,
      }));

      // Simulasi network delay autentikasi (800ms)
      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isLoading: false }));
        onLoginSuccess();
      }, 800);
    },
    [formState],
  );

  return {
    formState,
    handleHubChange,
    handleEmailChange,
    handlePasswordChange,
    handleRememberMeChange,
    toggleShowPassword,
    handleSubmit,
  };
}
