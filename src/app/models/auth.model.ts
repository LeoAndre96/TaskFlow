export interface AuthUser {
  id?: number;
  nombres: string;
  apellidos: string;
  email: string;
  dni: string;
  username: string;
  telefono: string;
  password?: string;
  role: string;
  roleId?: number;
}

export interface LoginCredentials {
  identifier: string; // Puede ser correo o username
  password: string;
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  email: string;
  dni: string;
  username: string;
  telefono: string;
  password: string;
  repetirPassword: string;
}

export interface RecoveryStep1Request {
  email: string;
}

export interface RecoveryStep2Request {
  email: string;
  codigo: string;
}

export interface RecoveryStep3Request {
  email: string;
  codigo: string;
  newPassword: string;
  confirmPassword: string;
}
