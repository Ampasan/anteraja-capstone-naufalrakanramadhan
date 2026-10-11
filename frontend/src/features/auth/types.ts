export interface AuthUser {
  id: string;
  name: string;
  email: string;
  hubName: string;
  hubId: string;
  role: 'dispatcher' | 'supervisor' | 'admin';
}

export interface LoginCredentials {
  hubId: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormState extends LoginCredentials {
  showPassword: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface LoginPageProps {
  onLoginSuccess: () => void;
}
