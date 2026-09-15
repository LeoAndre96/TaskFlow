import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthUser, LoginCredentials, RegisterRequest } from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://192.168.18.74:8080/api/v1';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Memoria dinámica para códigos de recuperación
  private recoveryCodes: { [email: string]: string } = {};

  constructor(private http: HttpClient) {
    this.initDynamicStorage();
    this.loadSession();
  }

  /**
   * Inicializa almacén dinámico en LocalStorage si no existe.
   * Contiene usuarios dinámicos para que el sistema funcione 100% interactivo
   * sin depender obligatoriamente del backend en este momento.
   */
  private initDynamicStorage() {
    if (!localStorage.getItem('taskflow_auth_users')) {
      const initialUsers: AuthUser[] = [
        {
          id: 1,
          nombres: 'Carlos',
          apellidos: 'Admin',
          email: 'carlos.admin@taskflow.io',
          username: 'carlosadmin',
          dni: '74859612',
          telefono: '+51 987654321',
          password: 'password123',
          role: 'Admin',
          roleId: 1
        },
        {
          id: 2,
          nombres: 'Mariana',
          apellidos: 'PO',
          email: 'mariana.po@taskflow.io',
          username: 'marianapo',
          dni: '45871236',
          telefono: '+51 981122334',
          password: 'password123',
          role: 'Product Owner',
          roleId: 2
        }
      ];
      localStorage.setItem('taskflow_auth_users', JSON.stringify(initialUsers));
    }
  }

  private loadSession() {
    const saved = localStorage.getItem('taskflow_session_user');
    if (saved) {
      try {
        this.currentUserSubject.next(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('taskflow_session_user');
      }
    }
  }

  private getStoredUsers(): AuthUser[] {
    return JSON.parse(localStorage.getItem('taskflow_auth_users') || '[]');
  }

  private saveStoredUsers(users: AuthUser[]) {
    localStorage.setItem('taskflow_auth_users', JSON.stringify(users));
  }

  /**
   * INICIAR SESIÓN
   * Intenta llamar al backend Java 17; si no está activo, valida contra
   * los usuarios dinámicos registrados.
   */
  login(credentials: LoginCredentials): Observable<AuthUser> {
    const identifier = credentials.identifier.trim().toLowerCase();
    const pass = credentials.password;

    return this.http.post<AuthUser>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(user => this.setSession(user)),
      catchError(() => {
        // Fallback dinámico local
        const users = this.getStoredUsers();
        const found = users.find(u =>
          (u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier) &&
          u.password === pass
        );

        if (found) {
          this.setSession(found);
          return of(found);
        } else {
          return throwError(() => new Error('Credenciales incorrectas. Verifique su correo/usuario y contraseña.'));
        }
      })
    );
  }

  /**
   * REGISTRAR USUARIO
   * Crea dinámicamente el usuario, lo guarda en el almacén de autenticación
   * y en la lista general de usuarios de TaskFlow.
   */
  register(data: RegisterRequest): Observable<AuthUser> {
    if (data.password !== data.repetirPassword) {
      return throwError(() => new Error('Las contraseñas no coinciden.'));
    }

    return this.http.post<AuthUser>(`${this.apiUrl}/auth/register`, data).pipe(
      catchError(() => {
        const users = this.getStoredUsers();

        // Validar unicidad de correo y username
        const emailExists = users.some(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
        if (emailExists) {
          return throwError(() => new Error('El correo electrónico ya se encuentra registrado.'));
        }

        const usernameExists = users.some(u => u.username.toLowerCase() === data.username.trim().toLowerCase());
        if (usernameExists) {
          return throwError(() => new Error('El nombre de usuario (Username) ya está en uso.'));
        }

        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        const newUser: AuthUser = {
          id: newId,
          nombres: data.nombres.trim(),
          apellidos: data.apellidos.trim(),
          email: data.email.trim().toLowerCase(),
          dni: data.dni.trim(),
          username: data.username.trim().toLowerCase(),
          telefono: data.telefono.trim(),
          password: data.password,
          role: 'Lead Developer',
          roleId: 4
        };

        users.push(newUser);
        this.saveStoredUsers(users);

        // También sincronizar con la lista general de usuarios en TaskflowService
        this.syncToTaskflowUsers(newUser);

        return of(newUser);
      })
    );
  }

  private syncToTaskflowUsers(authUser: AuthUser) {
    const raw = localStorage.getItem('taskflow_ng_users');
    const appUsers: User[] = raw ? JSON.parse(raw) : [];
    const exists = appUsers.some(u => u.email.toLowerCase() === authUser.email.toLowerCase());
    if (!exists) {
      appUsers.push({
        id: authUser.id,
        name: `${authUser.nombres} ${authUser.apellidos}`.trim(),
        email: authUser.email,
        role: authUser.role,
        roleId: authUser.roleId
      });
      localStorage.setItem('taskflow_ng_users', JSON.stringify(appUsers));
    }
  }

  /**
   * RECUPERAR CONTRASEÑA - PASO 1
   * Genera código de 6 dígitos para el correo ingresado
   */
  requestRecoveryCode(email: string): Observable<{ success: boolean; code: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    return this.http.post<{ success: boolean; code: string; message: string }>(`${this.apiUrl}/auth/recover/code`, { email: cleanEmail }).pipe(
      catchError(() => {
        const users = this.getStoredUsers();
        const user = users.find(u => u.email.toLowerCase() === cleanEmail);

        if (!user) {
          return throwError(() => new Error('No se encontró ninguna cuenta asociada a este correo.'));
        }

        // Generar código aleatorio de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.recoveryCodes[cleanEmail] = code;

        return of({
          success: true,
          code: code,
          message: `Código de verificación generado: ${code}`
        });
      })
    );
  }

  /**
   * RECUPERAR CONTRASEÑA - PASO 2
   * Verifica que el código coincida
   */
  verifyRecoveryCode(email: string, code: string): Observable<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    return this.http.post<boolean>(`${this.apiUrl}/auth/recover/verify`, { email: cleanEmail, code: cleanCode }).pipe(
      catchError(() => {
        const expectedCode = this.recoveryCodes[cleanEmail];
        if (expectedCode && expectedCode === cleanCode) {
          return of(true);
        } else {
          return throwError(() => new Error('El código ingresado es inválido o ha expirado.'));
        }
      })
    );
  }

  /**
   * RECUPERAR CONTRASEÑA - PASO 3
   * Actualiza dinámicamente la contraseña del usuario
   */
  resetPassword(email: string, newPassword: string): Observable<boolean> {
    const cleanEmail = email.trim().toLowerCase();

    return this.http.post<boolean>(`${this.apiUrl}/auth/recover/reset`, { email: cleanEmail, newPassword }).pipe(
      catchError(() => {
        const users = this.getStoredUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          users[idx].password = newPassword;
          this.saveStoredUsers(users);
          delete this.recoveryCodes[cleanEmail];
          return of(true);
        } else {
          return throwError(() => new Error('Usuario no encontrado al intentar cambiar contraseña.'));
        }
      })
    );
  }

  setSession(user: AuthUser) {
    const safeUser: AuthUser = { ...user };
    delete safeUser.password;
    localStorage.setItem('taskflow_session_user', JSON.stringify(safeUser));
    this.currentUserSubject.next(safeUser);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  logout() {
    localStorage.removeItem('taskflow_session_user');
    this.currentUserSubject.next(null);
  }
}
