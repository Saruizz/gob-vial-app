import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  AdminService,
  ReporteAdmin,
  PaginatedResult,
  TriageInput,
} from '../../core/services/admin.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styles: [`
    :host { display: block; height: 100dvh; }
    .map-container { height: 300px; border-radius: 12px; overflow: hidden; }
    #admin-mapa-container { min-height: 400px; }
  `],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private http = inject(HttpClient);

  reportes = signal<ReporteAdmin[]>([]);
  reporteSeleccionado = signal<ReporteAdmin | null>(null);
  isLoading = signal(false);
  triageSuccess = signal(false);
  vistaActiva = signal<'reportes' | 'mapa'>('reportes');

  filtroEstado = signal<number | null>(1);
  currentPage = signal(1);
  totalPages = signal(1);
  totalReportes = signal(0);
  pageSize = 10;

  todosLosReportes: ReporteAdmin[] = [];

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
  private clusterGroup: L.MarkerClusterGroup | null = null;

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

  cargarReportesMapa(): void {
    if (this.todosLosReportes.length > 0) {
      setTimeout(() => this.inicializarMapaGeneral(), 100);
      return;
    }

    this.isLoading.set(true);

    this.adminService.listarReportes(null, 1, 500).subscribe({
      next: (res: PaginatedResult<ReporteAdmin>) => {
        this.todosLosReportes = res.data;
        this.isLoading.set(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => this.inicializarMapaGeneral());
        });
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private inicializarMapaGeneral(): void {
    const container = document.getElementById('admin-mapa-container');
    if (!container) {
      requestAnimationFrame(() => this.inicializarMapaGeneral());
      return;
    }

    if (this.mapaActual) {
      this.mapaActual.remove();
    }

    this.mapaActual = L.map('admin-mapa-container').setView([10.5, -74.3], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | GoberVial',
      maxZoom: 18,
    }).addTo(this.mapaActual);

    if (this.clusterGroup) {
      this.mapaActual.removeLayer(this.clusterGroup);
    }

    this.clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let bg = count < 10 ? 'bg-blue-600' : count < 50 ? 'bg-yellow-500' : 'bg-red-500';
        return L.divIcon({
          html: `<div class="w-10 h-10 ${bg} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
    });

    const markers: L.Marker[] = [];
    const self = this;

    for (const r of this.todosLosReportes) {
      const marker = L.marker([r.latitud, r.longitud], {
        icon: L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${r.estado_color || '#3B82F6'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          className: 'custom-pin-icon',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      });

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;font-size:13px;min-width:180px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${r.estado_color};display:inline-block"></span>
            <strong>${r.categoria_nombre}</strong>
          </div>
          <p style="margin:2px 0;color:#666">Municipio: ${r.municipio_nombre}</p>
          <p style="margin:2px 0;color:#666">Peligro: ${r.nivel_peligro}</p>
          <p style="margin:2px 0;color:#666">Estado: ${r.estado_nombre}</p>
          <p style="margin:2px 0;color:#666">Ciudadano: ${r.ciudadano_nombre}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#999">Click en el pin para ver detalle</p>
        </div>
      `);

      marker.on('click', () => {
        self.verDetalle(r);
      });

      markers.push(marker);
    }

    this.clusterGroup.addLayers(markers);
    this.mapaActual.addLayer(this.clusterGroup);

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()));
      this.mapaActual.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }

    setTimeout(() => this.mapaActual?.invalidateSize(), 300);
  }

  verDetalle(reporte: ReporteAdmin): void {
    this.reporteSeleccionado.set(reporte);
    this.triageAccion = 'aceptar';
    this.triagePrioridad = 'Preventiva';
    this.triageMotivo = '';
    this.triageComentario = '';
    this.triageSuccess.set(false);
    this.triageEnviando = false;

    setTimeout(() => this.inicializarMapaDetalle(reporte), 100);
  }

  cerrarDetalle(): void {
    this.reporteSeleccionado.set(null);
    if (this.mapaActual) {
      this.mapaActual.remove();
      this.mapaActual = null;
    }
  }

  private inicializarMapaDetalle(reporte: ReporteAdmin): void {
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
