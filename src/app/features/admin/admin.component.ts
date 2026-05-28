import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-900 p-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Panel de Administracion</h1>
        <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition">
          Cerrar Sesion
        </button>
      </div>
      <p class="text-gray-400 mt-2">Modulo de triage en construccion.</p>
    </div>
  `,
})
export class AdminComponent {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
