export interface User {
  id: number;
  rolId: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  email: string;
  telefono: string | null;
  estadoBiometria: BiometriaEstado;
  fechaRegistro: string;
}

export type BiometriaEstado = 'Pendiente' | 'Verificada' | 'Rechazada';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  email: string;
  telefono?: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface BiometriaStatus {
  estado: BiometriaEstado;
  mensaje: string;
}
