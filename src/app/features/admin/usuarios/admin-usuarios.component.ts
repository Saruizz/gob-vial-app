import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AdminUsuariosService,
  UsuarioAdmin,
  PaginatedResult,
} from '../../../core/services/admin-usuarios.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.component.html',
})
export class AdminUsuariosComponent implements OnInit {
  private adminUsuariosService = inject(AdminUsuariosService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  usuarios = signal<UsuarioAdmin[]>([]);
  isLoading = signal(false);
  searchTerm = '';
  filtroRol = signal<number | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalUsuarios = signal(0);
  pageSize = 10;

  usuarioEditando = signal<UsuarioAdmin | null>(null);
  editRol = 1;
  editEstado = true;
  editBiometria = 'Pendiente';
  editando = false;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading.set(true);

    const search = this.searchTerm.trim() || null;

    this.adminUsuariosService
      .listarUsuarios(this.filtroRol(), search, this.currentPage(), this.pageSize)
      .subscribe({
        next: (res: PaginatedResult<UsuarioAdmin>) => {
          this.usuarios.set(res.data);
          this.totalPages.set(res.meta.totalPages);
          this.totalUsuarios.set(res.meta.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  buscar(): void {
    this.currentPage.set(1);
    this.cargarUsuarios();
  }

  cambiarFiltro(rolId: number | null): void {
    this.filtroRol.set(rolId);
    this.currentPage.set(1);
    this.cargarUsuarios();
  }

  paginaAnterior(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.cargarUsuarios();
    }
  }

  paginaSiguiente(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.cargarUsuarios();
    }
  }

  abrirEditar(usuario: UsuarioAdmin): void {
    this.usuarioEditando.set(usuario);
    this.editRol = usuario.rol_id;
    this.editEstado = usuario.estado_cuenta;
    this.editBiometria = usuario.estado_biometria;
    this.editando = false;
  }

  cerrarEditar(): void {
    this.usuarioEditando.set(null);
  }

  guardarCambios(): void {
    const user = this.usuarioEditando();
    if (!user) return;

    this.editando = true;

    const promesas: Promise<unknown>[] = [];

    if (this.editRol !== user.rol_id) {
      promesas.push(
        new Promise((resolve, reject) => {
          this.adminUsuariosService.cambiarRol(user.id, this.editRol).subscribe({
            next: () => {
              this.notificationService.success('Rol actualizado correctamente');
              resolve(true);
            },
            error: (err) => reject(err),
          });
        })
      );
    }

    if (this.editEstado !== user.estado_cuenta) {
      promesas.push(
        new Promise((resolve, reject) => {
          this.adminUsuariosService.cambiarEstado(user.id, this.editEstado).subscribe({
            next: () => {
              this.notificationService.success('Estado de cuenta actualizado');
              resolve(true);
            },
            error: (err) => reject(err),
          });
        })
      );
    }

    if (this.editBiometria !== user.estado_biometria) {
      promesas.push(
        new Promise((resolve, reject) => {
          this.adminUsuariosService
            .cambiarBiometria(user.id, this.editBiometria)
            .subscribe({
              next: () => {
                this.notificationService.success('Biometria actualizada');
                resolve(true);
              },
              error: (err) => reject(err),
            });
        })
      );
    }

    Promise.allSettled(promesas).then(() => {
      this.editando = false;
      this.cerrarEditar();
      this.cargarUsuarios();
    });
  }

  getEstadoBiometriaClass(estado: string): string {
    const classes: Record<string, string> = {
      Verificada: 'text-green-300',
      Pendiente: 'text-yellow-300',
      Rechazada: 'text-red-300',
    };
    return classes[estado] || '';
  }

  goToReportes(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
