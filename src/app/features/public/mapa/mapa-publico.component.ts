import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import * as L from 'leaflet';
import 'leaflet.markercluster';

interface PinPublico {
  id: number;
  latitud: number;
  longitud: number;
  nivel_peligro: string;
  prioridad_asignada: string | null;
  estado_color: string;
  estado_nombre: string;
  categoria_nombre: string;
  municipio_nombre: string;
  fecha_creacion: string;
}

@Component({
  selector: 'app-mapa-publico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-dvh flex flex-col">
      <header class="bg-white shadow-md px-6 py-3 flex items-center justify-between shrink-0 z-10">
        <div class="flex items-center gap-3">
          <svg class="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V5.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <div>
            <h1 class="text-lg font-bold text-gray-900">GoberVial</h1>
            <p class="text-xs text-gray-500">Visor de Transparencia - Magdalena</p>
          </div>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-gray-500">{{ totalPines }} reportes mapeados</span>
          <a routerLink="/register" class="text-green-600 font-medium hover:underline">Registrarse</a>
          <a routerLink="/login" class="text-blue-600 font-medium hover:underline">Iniciar Sesion</a>
        </div>
      </header>
      <div class="flex-1 relative">
        <div id="public-map" class="absolute inset-0"></div>
        <div *ngIf="isLoading" class="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 z-50">
          Cargando reportes...
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100dvh; }
  `],
})
export class MapaPublicoComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private mapa: L.Map | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;

  isLoading = true;
  totalPines = 0;

  ngOnInit(): void {
    setTimeout(() => this.inicializarMapa(), 100);
  }

  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
    }
  }

  private inicializarMapa(): void {
    const container = document.getElementById('public-map');
    if (!container) return;

    this.mapa = L.map('public-map', {
      center: [10.5, -74.3],
      zoom: 9,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | GoberVial - Gobernacion del Magdalena',
      maxZoom: 18,
    }).addTo(this.mapa);

    this.cargarPines();
  }

  private cargarPines(): void {
    this.http
      .get<{ success: boolean; data: PinPublico[] }>(
        `${environment.apiUrl}/public/reportes`
      )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.totalPines = res.data.length;

          if (!this.mapa) return;

          this.clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: (cluster) => {
              const count = cluster.getChildCount();
              let size: string;
              let colorClass: string;

              if (count < 10) {
                size = 'w-8 h-8';
                colorClass = 'bg-blue-600';
              } else if (count < 50) {
                size = 'w-10 h-10';
                colorClass = 'bg-yellow-500';
              } else {
                size = 'w-12 h-12';
                colorClass = 'bg-red-500';
              }

              return L.divIcon({
                html: `<div class="${size} ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white">${count}</div>`,
                className: 'custom-cluster-icon',
                iconSize: L.point(40, 40),
              });
            },
          });

          const markers: L.Marker[] = [];

          for (const pin of res.data) {
            const marker = L.marker([pin.latitud, pin.longitud], {
              icon: L.divIcon({
                html: `<div style="width:16px;height:16px;border-radius:50%;background:${pin.estado_color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
                className: 'custom-pin-icon',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
            });

            marker.bindPopup(`
              <div style="font-family:system-ui,sans-serif;font-size:13px;min-width:180px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                  <span style="width:10px;height:10px;border-radius:50%;background:${pin.estado_color};display:inline-block"></span>
                  <strong>${pin.categoria_nombre}</strong>
                </div>
                <p style="margin:2px 0;color:#666"><strong>Municipio:</strong> ${pin.municipio_nombre}</p>
                <p style="margin:2px 0;color:#666"><strong>Peligro:</strong> ${pin.nivel_peligro}</p>
                <p style="margin:2px 0;color:#666"><strong>Estado:</strong> ${pin.estado_nombre}</p>
                ${pin.prioridad_asignada ? `<p style="margin:2px 0;color:#666"><strong>Prioridad:</strong> ${pin.prioridad_asignada}</p>` : ''}
                <p style="margin:4px 0 0;font-size:11px;color:#999">${new Date(pin.fecha_creacion).toLocaleDateString('es-CO')}</p>
              </div>
            `);

            markers.push(marker);
          }

          this.clusterGroup.addLayers(markers);
          this.mapa.addLayer(this.clusterGroup);

          if (markers.length > 0) {
            const bounds = L.latLngBounds(
              markers.map((m) => m.getLatLng())
            );
            this.mapa.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }
}
