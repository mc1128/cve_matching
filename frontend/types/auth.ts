export interface User {
  user_id: number;
  user_name: string;
  email: string;
  department?: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface OTPRequest {
  email: string;
  otp: string;
}

export interface RegisterRequest {
  user_name: string;
  email: string;
  department?: string;
  otp: string;
}

export interface EmailRequest {
  email: string;
}

export interface OTPResponse {
  message: string;
  email: string;
  debug_otp?: string; // 개발 환경에서만
}
