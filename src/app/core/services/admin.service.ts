import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/auth.model';

export interface ReporteAdmin {
  id: number;
  ciudadano_id: number;
  admin_id: number | null;
  categoria_id: number;
  estado_id: number;
  municipio_id: number;
  nivel_peligro: string;
  prioridad_asignada: string | null;
  latitud: number;
  longitud: number;
  evidencia_foto_url: string;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_nombre: string;
  estado_color: string;
  categoria_nombre: string;
  municipio_nombre: string;
  ciudadano_nombre: string;
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

export interface TriageInput {
  accion: 'aceptar' | 'rechazar';
  prioridad?: string;
  motivoRechazo?: string;
  comentarioTecnico?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarReportes(estadoId: number | null, page: number, limit: number): Observable<PaginatedResult<ReporteAdmin>> {
    let url = `${this.apiUrl}/reportes?page=${page}&limit=${limit}`;
    if (estadoId !== null) {
      url += `&estadoId=${estadoId}`;
    }
    return this.http.get<PaginatedResult<ReporteAdmin>>(url);
  }

  obtenerReporte(id: number): Observable<ApiResponse<ReporteAdmin>> {
    return this.http.get<ApiResponse<ReporteAdmin>>(`${this.apiUrl}/reportes/${id}`);
  }

  realizarTriage(id: number, input: TriageInput): Observable<ApiResponse<ReporteAdmin>> {
    return this.http.post<ApiResponse<ReporteAdmin>>(
      `${this.apiUrl}/reportes/${id}/triage`,
      input
    );
  }
}
