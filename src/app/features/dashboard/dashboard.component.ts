import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div class="max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-white">GoberVial</h1>
            <p class="text-blue-300 text-sm">Auditoria Ciudadana</p>
          </div>
          <button (click)="logout()"
            class="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition">
            Salir
          </button>
        </div>

        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-4">
          <h2 class="text-lg font-semibold text-white mb-1">{{ userName }}</h2>
          <p class="text-blue-300 text-sm">
            Biometria:
            <span [class.text-green-300]="estadoBiometria === 'Verificada'"
                  [class.text-yellow-300]="estadoBiometria === 'Pendiente'"
                  [class.text-red-300]="estadoBiometria === 'Rechazada'">
              {{ estadoBiometria }}
            </span>
          </p>
        </div>

        <button (click)="goToNuevoReporte()"
          class="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-3 mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Reporte de Dano Vial
        </button>

        <div class="bg-white/5 rounded-xl p-4 text-center">
          <p class="text-blue-300/50 text-sm">Mis reportes apareceran aqui proximamente</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nombres} ${user.apellidos}` : 'Ciudadano';
  }

  get estadoBiometria(): string {
    const user = this.authService.getCurrentUser();
    return user?.estadoBiometria || 'Desconocido';
  }

  goToNuevoReporte(): void {
    this.router.navigate(['/nuevo-reporte']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
