import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../shared/models/auth.model';

export interface ReportePayload {
  categoriaId: number;
  municipioId: number;
  nivelPeligro: string;
  latitud: number;
  longitud: number;
  evidencia: File;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/reportes';

  constructor(private http: HttpClient) {}

  crearReporte(payload: ReportePayload): Observable<unknown> {
    const formData = new FormData();
    formData.append('categoriaId', payload.categoriaId.toString());
    formData.append('municipioId', payload.municipioId.toString());
    formData.append('nivelPeligro', payload.nivelPeligro);
    formData.append('latitud', payload.latitud.toString());
    formData.append('longitud', payload.longitud.toString());
    formData.append('evidencia', payload.evidencia, 'evidencia.jpg');

    return this.http
      .post<ApiResponse<unknown>>(this.apiUrl, formData)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message);
          }
          return res.data;
        })
      );
  }
}
