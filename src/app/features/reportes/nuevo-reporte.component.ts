import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { ReporteService, ReportePayload } from '../../core/services/reporte.service';

@Component({
  selector: 'app-nuevo-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-reporte.component.html',
})
export class NuevoReporteComponent {
  private reporteService = inject(ReporteService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  currentStep = 1;
  totalSteps = 3;

  categoriaId: number | null = null;
  municipioId: number | null = null;
  nivelPeligro: string | null = null;
  latitud: number | null = null;
  longitud: number | null = null;
  foto: File | null = null;
  fotoPreview: string | null = null;

  isLoading = signal(false);
  coordenadasObtenidas = signal(false);

  categorias = [
    { id: 1, nombre: 'Bache / Hueco' },
    { id: 2, nombre: 'Inundacion / Alcantarillado' },
    { id: 3, nombre: 'Via Destapada' },
    { id: 4, nombre: 'Hundimiento' },
    { id: 5, nombre: 'Senalizacion Danada' },
    { id: 6, nombre: 'Semaforo Danado' },
  ];

  nivelesPeligro = [
    { id: 'Bajo', nombre: 'Bajo', color: 'bg-yellow-500' },
    { id: 'Medio', nombre: 'Medio', color: 'bg-orange-500' },
    { id: 'Alto', nombre: 'Alto', color: 'bg-red-500' },
    { id: 'Critico', nombre: 'Critico', color: 'bg-purple-700' },
  ];

  municipios = [
    { id: 1, nombre: 'Santa Marta' },
    { id: 8, nombre: 'Cienaga' },
    { id: 13, nombre: 'Fundacion' },
    { id: 10, nombre: 'El Banco' },
    { id: 19, nombre: 'Plato' },
    { id: 18, nombre: 'Pivijay' },
    { id: 3, nombre: 'Aracataca' },
    { id: 20, nombre: 'Puebloviejo' },
    { id: 4, nombre: 'Ariguani' },
    { id: 2, nombre: 'Algarrobo' },
    { id: 5, nombre: 'Cerro de San Antonio' },
    { id: 6, nombre: 'Chibolo' },
    { id: 7, nombre: 'Chivolo' },
    { id: 9, nombre: 'Concordia' },
    { id: 11, nombre: 'El Pinon' },
    { id: 12, nombre: 'El Reten' },
    { id: 14, nombre: 'Guamal' },
    { id: 15, nombre: 'Nueva Granada' },
    { id: 16, nombre: 'Pedraza' },
    { id: 17, nombre: 'Pijino del Carmen' },
    { id: 21, nombre: 'Remolino' },
    { id: 22, nombre: 'Sabanas de San Angel' },
    { id: 23, nombre: 'Salamina' },
    { id: 24, nombre: 'San Sebastian de Buenavista' },
    { id: 25, nombre: 'San Zenon' },
    { id: 26, nombre: 'Santa Ana' },
    { id: 27, nombre: 'Santa Barbara de Pinto' },
    { id: 28, nombre: 'Sitionuevo' },
    { id: 29, nombre: 'Tenerife' },
    { id: 30, nombre: 'Zapayan' },
    { id: 31, nombre: 'Zona Bananera' },
  ];

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.categoriaId || !this.municipioId || !this.nivelPeligro) {
        this.notificationService.warning('Selecciona todos los campos requeridos', 'Formulario incompleto');
        return;
      }
    }
    if (this.currentStep === 2) {
      if (!this.foto || !this.latitud || !this.longitud) {
        this.notificationService.warning('Debes capturar la foto y obtener las coordenadas GPS', 'Datos faltantes');
        return;
      }
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  seleccionarCategoria(id: number): void {
    this.categoriaId = id;
  }

  seleccionarNivelPeligro(nivel: string): void {
    this.nivelPeligro = nivel;
  }

  async capturarFoto(): Promise<void> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        this.fotoPreview = image.dataUrl;
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        this.foto = new File([blob], `evidencia-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
    } catch {
      this.notificationService.error('No se pudo acceder a la camara. Verifica los permisos.', 'Error de camara');
    }
  }

  async capturarUbicacion(): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      this.latitud = position.coords.latitude;
      this.longitud = position.coords.longitude;
      this.coordenadasObtenidas.set(true);
    } catch {
      this.latitud = 11.2408;
      this.longitud = -74.199;
      this.coordenadasObtenidas.set(true);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.foto || !this.latitud || !this.longitud || !this.categoriaId || !this.municipioId || !this.nivelPeligro) {
      return;
    }

    this.isLoading.set(true);

    const payload: ReportePayload = {
      categoriaId: this.categoriaId,
      municipioId: this.municipioId,
      nivelPeligro: this.nivelPeligro,
      latitud: this.latitud,
      longitud: this.longitud,
      evidencia: this.foto,
    };

    this.reporteService.crearReporte(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.success('Reporte creado exitosamente', 'Reporte enviado');
        this.currentStep = 3;
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
