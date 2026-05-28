import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { catchError, throwError } from 'rxjs';
import { ApiErrorResponse } from '../../shared/models/error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notificationService.error('No se pudo conectar con el servidor', 'Error de conexion');
        return throwError(() => error);
      }

      if (error.status === 401) {
        return throwError(() => error);
      }

      const apiError = error.error as ApiErrorResponse;

      if (apiError?.errors && apiError.errors.length > 0) {
        const fieldMessages = apiError.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join('\n');
        notificationService.error(fieldMessages, apiError.message);
      } else if (apiError?.message) {
        notificationService.error(apiError.message);
      } else if (error.status === 400) {
        notificationService.error('Datos invalidos. Revisa el formulario.', 'Error de validacion');
      } else if (error.status === 403) {
        notificationService.error('No tienes permisos para realizar esta accion.', 'Acceso denegado');
      } else if (error.status === 404) {
        notificationService.error('El recurso solicitado no existe.', 'No encontrado');
      } else if (error.status >= 500) {
        notificationService.error('Error interno del servidor. Intenta de nuevo.', 'Error del servidor');
      }

      return throwError(() => error);
    })
  );
};
