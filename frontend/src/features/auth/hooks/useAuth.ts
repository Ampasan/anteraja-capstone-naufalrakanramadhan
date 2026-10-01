import { useCallback, useRef, useState } from 'react';
import type { LoginFormState } from '../types';
import { api, ApiError } from '../../../lib/api';
import { setSession, type SessionUser } from '../../../lib/session';
import { useHubs } from '../../../hooks/useHubs';
import type { Hub } from '../../monitoring/types';

interface LoginResponse {
  token: string;
  user: SessionUser;
}

const INITIAL_STATE: LoginFormState = {
  hubId: '',
  email: '',
  password: '',
  rememberMe: false,
  showPassword: false,
  isLoading: false,
  errorMessage: null,
};

interface UseAuthReturn {
  formState: LoginFormState;
  hubs: Hub[];
  /** Daftar hub belum siap dipilih. */
  isPreparing: boolean;
  handleHubChange: (hubId: string) => void;
  handleEmailChange: (email: string) => void;
  handlePasswordChange: (password: string) => void;
  handleRememberMeChange: (checked: boolean) => void;
  toggleShowPassword: () => void;
  handleSubmit: (onLoginSuccess: () => void) => void;
}

/** Pesan ramah untuk kode status yang paling sering muncul. */
function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Email atau kata sandi salah.';
    if (error.status === 419) return 'Sesi halaman kedaluwarsa. Muat ulang halaman.';
    if (error.status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    if (error.status >= 500) return 'Server sedang bermasalah. Coba beberapa saat lagi.';
    return error.message;
  }
  if (error instanceof TypeError) return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
  return 'Terjadi kesalahan yang tidak terduga. Coba lagi.';
}

export function useAuth(): UseAuthReturn {
  const [formState, setFormState] = useState<LoginFormState>(INITIAL_STATE);
  // Kunci anti klik-ganda. Ref dipakai (bukan state) agar pengecekan terjadi
  // tepat pada saat event, bukan pada render berikutnya.
  const busyRef = useRef(false);
  const { hubs, loading: hubsLoading } = useHubs();

  // Pilih hub pertama secara otomatis begitu daftar hub tersedia. Dilakukan
  // saat render (bukan di effect) agar tidak memicu render berantai.
  const selectedHubId = formState.hubId || hubs[0]?.id || '';

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
      if (busyRef.current) return;

      if (!selectedHubId) {
        setFormState((prev) => ({
          ...prev,
          errorMessage: 'Pilih stasiun layanan terlebih dahulu.',
        }));
        return;
      }
      if (!formState.email.trim() || !formState.password) {
        setFormState((prev) => ({ ...prev, errorMessage: 'Email dan kata sandi wajib diisi.' }));
        return;
      }

      busyRef.current = true;
      setFormState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

      api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formState.email.trim(),
          password: formState.password,
          hub_id: selectedHubId,
        }),
      })
        .then((result) => {
          setSession(result.token, result.user, formState.rememberMe);
          setFormState((prev) => ({ ...prev, isLoading: false, errorMessage: null }));
          onLoginSuccess();
        })
        .catch((error: unknown) => {
          setFormState((prev) => ({
            ...prev,
            isLoading: false,
            errorMessage: friendlyError(error),
          }));
        })
        .finally(() => {
          busyRef.current = false;
        });
    },
    [selectedHubId, formState.email, formState.password, formState.rememberMe],
  );

  return {
    formState: { ...formState, hubId: selectedHubId },
    hubs,
    isPreparing: hubsLoading,
    handleHubChange,
    handleEmailChange,
    handlePasswordChange,
    handleRememberMeChange,
    toggleShowPassword,
    handleSubmit,
  };
}
