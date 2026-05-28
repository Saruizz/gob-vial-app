import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-8">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard Ciudadano</h1>
      <p class="text-gray-600 mt-2">Bienvenido, {{ userName }}.</p>
      <p class="text-gray-500 text-sm mt-1">Estado de biometria: {{ estadoBiometria }}</p>
      <button (click)="logout()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
        Cerrar Sesion
      </button>
    </div>
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nombres} ${user.apellidos}` : 'Ciudadano';
  }

  get estadoBiometria(): string {
    const user = this.authService.getCurrentUser();
    return user?.estadoBiometria || 'Desconocido';
  }

  logout(): void {
    this.authService.logout();
  }
}
