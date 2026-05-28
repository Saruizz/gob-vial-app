import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/auth.model';

export interface UsuarioAdmin {
  id: number;
  rol_id: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  email: string;
  telefono: string | null;
  estado_biometria: string;
  fecha_registro: string;
  ultimo_login: string | null;
  estado_cuenta: boolean;
  rol_nombre: string;
}

export interface PaginatedResult<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminUsuariosService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarUsuarios(
    rolId: number | null,
    search: string | null,
    page: number,
    limit: number
  ): Observable<PaginatedResult<UsuarioAdmin>> {
    let url = `${this.apiUrl}/usuarios?page=${page}&limit=${limit}`;
    if (rolId !== null) url += `&rolId=${rolId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<PaginatedResult<UsuarioAdmin>>(url);
  }

  obtenerUsuario(id: number): Observable<ApiResponse<UsuarioAdmin>> {
    return this.http.get<ApiResponse<UsuarioAdmin>>(`${this.apiUrl}/usuarios/${id}`);
  }

  cambiarRol(id: number, rolId: number): Observable<ApiResponse<UsuarioAdmin>> {
    return this.http.put<ApiResponse<UsuarioAdmin>>(`${this.apiUrl}/usuarios/${id}/rol`, {
      rolId,
    });
  }

  cambiarEstado(id: number, activo: boolean): Observable<ApiResponse<UsuarioAdmin>> {
    return this.http.put<ApiResponse<UsuarioAdmin>>(`${this.apiUrl}/usuarios/${id}/estado`, {
      activo,
    });
  }

  cambiarBiometria(id: number, estado: string): Observable<ApiResponse<UsuarioAdmin>> {
    return this.http.put<ApiResponse<UsuarioAdmin>>(`${this.apiUrl}/usuarios/${id}/biometria`, {
      estado,
    });
  }
}
