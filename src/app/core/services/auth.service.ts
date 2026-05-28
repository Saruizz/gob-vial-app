import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  ApiResponse,
  BiometriaStatus,
} from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  register(data: RegisterRequest): Observable<TokenResponse> {
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiUrl}/register`, data)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message);
          }
          return res.data;
        }),
        tap((tokenRes) => this.persistSession(tokenRes))
      );
  }

  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, data)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message);
          }
          return res.data;
        }),
        tap((tokenRes) => this.persistSession(tokenRes))
      );
  }

  getProfile(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.apiUrl}/profile`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message);
          }
          return res.data;
        }),
        tap((user) => this.currentUserSubject.next(user))
      );
  }

  verifyBiometria(): Observable<BiometriaStatus> {
    return this.http
      .post<ApiResponse<BiometriaStatus>>(`${this.apiUrl}/biometria/verify`, {})
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message);
          }
          return res.data;
        })
      );
  }

  getBiometriaStatus(): Observable<BiometriaStatus> {
    return this.http
      .get<ApiResponse<BiometriaStatus>>(`${this.apiUrl}/biometria/status`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message);
          }
          return res.data;
        })
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private persistSession(tokenRes: TokenResponse): void {
    localStorage.setItem('access_token', tokenRes.accessToken);
    localStorage.setItem('refresh_token', tokenRes.refreshToken);
    localStorage.setItem('user', JSON.stringify(tokenRes.user));
    this.currentUserSubject.next(tokenRes.user);
  }

  private loadUserFromStorage(): void {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw) as User;
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }
}
