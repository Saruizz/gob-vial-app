import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'mapa',
    loadComponent: () =>
      import('./features/public/mapa/mapa-publico.component').then(
        (m) => m.MapaPublicoComponent
      ),
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'nuevo-reporte',
    loadComponent: () =>
      import('./features/reportes/nuevo-reporte.component').then(
        (m) => m.NuevoReporteComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin.component').then(
        (m) => m.AdminComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./features/admin/usuarios/admin-usuarios.component').then(
        (m) => m.AdminUsuariosComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
