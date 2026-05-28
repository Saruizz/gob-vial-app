import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  AdminService,
  ReporteAdmin,
  PaginatedResult,
  TriageInput,
} from '../../core/services/admin.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styles: [`
    :host { display: block; height: 100dvh; }
    .map-container { height: 300px; border-radius: 12px; overflow: hidden; }
  `],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  reportes = signal<ReporteAdmin[]>([]);
  reporteSeleccionado = signal<ReporteAdmin | null>(null);
  isLoading = signal(false);
  triageSuccess = signal(false);

  filtroEstado = signal<number | null>(1);
  currentPage = signal(1);
  totalPages = signal(1);
  totalReportes = signal(0);
  pageSize = 10;

  estados = [
    { id: 1, nombre: 'Pendiente', color: '#F59E0B' },
    { id: 2, nombre: 'En Revision', color: '#3B82F6' },
    { id: 3, nombre: 'En Proceso', color: '#8B5CF6' },
    { id: 4, nombre: 'Resuelto', color: '#10B981' },
    { id: 5, nombre: 'Rechazado', color: '#EF4444' },
  ];

  prioridades = ['Baja', 'Preventiva', 'Urgente'] as const;

  triageAccion: 'aceptar' | 'rechazar' = 'aceptar';
  triagePrioridad: string = 'Preventiva';
  triageMotivo: string = '';
  triageComentario: string = '';
  triageEnviando = false;

  private mapaActual: L.Map | null = null;

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.isLoading.set(true);

    this.adminService
      .listarReportes(this.filtroEstado(), this.currentPage(), this.pageSize)
      .subscribe({
        next: (res: PaginatedResult<ReporteAdmin>) => {
          this.reportes.set(res.data);
          this.totalPages.set(res.meta.totalPages);
          this.totalReportes.set(res.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  cambiarFiltro(estadoId: number | null): void {
    this.filtroEstado.set(estadoId);
    this.currentPage.set(1);
    this.reporteSeleccionado.set(null);
    this.cargarReportes();
  }

  paginaAnterior(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.cargarReportes();
    }
  }

  paginaSiguiente(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.cargarReportes();
    }
  }

  verDetalle(reporte: ReporteAdmin): void {
    this.reporteSeleccionado.set(reporte);
    this.triageAccion = 'aceptar';
    this.triagePrioridad = 'Preventiva';
    this.triageMotivo = '';
    this.triageComentario = '';
    this.triageSuccess.set(false);
    this.triageEnviando = false;

    setTimeout(() => this.inicializarMapa(reporte), 100);
  }

  cerrarDetalle(): void {
    this.reporteSeleccionado.set(null);
    if (this.mapaActual) {
      this.mapaActual.remove();
      this.mapaActual = null;
    }
  }

  private inicializarMapa(reporte: ReporteAdmin): void {
    if (this.mapaActual) {
      this.mapaActual.remove();
    }

    const container = document.getElementById('admin-map');
    if (!container) return;

    this.mapaActual = L.map('admin-map').setView(
      [reporte.latitud, reporte.longitud],
      15
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.mapaActual);

    L.circleMarker([reporte.latitud, reporte.longitud], {
      radius: 10,
      fillColor: reporte.estado_color || '#3B82F6',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(this.mapaActual)
      .bindPopup(
        `<b>${reporte.categoria_nombre}</b><br>${reporte.municipio_nombre}<br>${reporte.nivel_peligro}`
      );

    setTimeout(() => {
      this.mapaActual?.invalidateSize();
    }, 200);
  }

  realizarTriage(): void {
    if (!this.reporteSeleccionado()) return;

    if (
      this.triageAccion === 'rechazar' &&
      !this.triageMotivo.trim()
    ) {
      this.notificationService.warning(
        'Debes escribir un motivo de rechazo',
        'Campo requerido'
      );
      return;
    }

    this.triageEnviando = true;

    const input: TriageInput = {
      accion: this.triageAccion,
      comentarioTecnico: this.triageComentario || undefined,
    };

    if (this.triageAccion === 'aceptar') {
      input.prioridad = this.triagePrioridad;
    } else {
      input.motivoRechazo = this.triageMotivo;
    }

    this.adminService
      .realizarTriage(this.reporteSeleccionado()!.id, input)
      .subscribe({
        next: () => {
          this.triageEnviando = false;
          this.triageSuccess.set(true);
          this.notificationService.success(
            `Reporte ${input.accion === 'aceptar' ? 'aceptado' : 'rechazado'} exitosamente`,
            'Triage completado'
          );
          this.cargarReportes();
        },
        error: () => {
          this.triageEnviando = false;
        },
      });
  }

  getEstadoClass(estadoId: number): string {
    const classes: Record<number, string> = {
      1: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
      2: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
      3: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      4: 'bg-green-500/20 text-green-200 border-green-400/30',
      5: 'bg-red-500/20 text-red-200 border-red-400/30',
    };
    return classes[estadoId] || classes[1];
  }

  getNivelPeligroClass(nivel: string): string {
    const classes: Record<string, string> = {
      Bajo: 'text-yellow-300',
      Medio: 'text-orange-300',
      Alto: 'text-red-300',
      Critico: 'text-purple-300',
    };
    return classes[nivel] || '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
