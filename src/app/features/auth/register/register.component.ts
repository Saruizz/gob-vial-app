import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, BiometriaEstado, BiometriaStatus } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  currentStep = 1;
  totalSteps = 3;

  identityForm: FormGroup = this.fb.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    numeroDocumento: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[a-z]/),
        Validators.pattern(/[0-9]/),
      ],
    ],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  biometriaEstado = signal<BiometriaEstado>('Pendiente');
  biometriaVerificando = signal(false);
  registroCompletado = signal(false);

  nextStep(): void {
    if (this.currentStep === 1) {
      const controls = ['nombres', 'apellidos', 'numeroDocumento', 'email', 'password'];
      controls.forEach((c) => this.identityForm.get(c)?.markAsTouched());
      const invalid = controls.some((c) => this.identityForm.get(c)?.invalid);
      if (invalid) return;
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

  onSubmit(): void {
    if (this.identityForm.invalid) {
      this.identityForm.markAllAsTouched();
      this.currentStep = 1;
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const data: RegisterRequest = {
      nombres: this.identityForm.value.nombres,
      apellidos: this.identityForm.value.apellidos,
      numeroDocumento: this.identityForm.value.numeroDocumento,
      email: this.identityForm.value.email,
      password: this.identityForm.value.password,
    };

    if (this.identityForm.value.telefono) {
      data.telefono = this.identityForm.value.telefono;
    }

    this.authService.register(data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.currentStep = 3;
        this.registroCompletado.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Error al registrar');
      },
    });
  }

  verificarBiometria(): void {
    this.biometriaVerificando.set(true);
    this.errorMessage.set(null);

    this.authService.verifyBiometria().subscribe({
      next: (res: BiometriaStatus) => {
        this.biometriaVerificando.set(false);
        this.biometriaEstado.set(res.estado);
      },
      error: (err: HttpErrorResponse) => {
        this.biometriaVerificando.set(false);
        this.errorMessage.set(err.error?.message || 'Error en verificacion biometrica');
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  get nombresCtrl() {
    return this.identityForm.get('nombres');
  }

  get apellidosCtrl() {
    return this.identityForm.get('apellidos');
  }

  get documentoCtrl() {
    return this.identityForm.get('numeroDocumento');
  }

  get emailCtrl() {
    return this.identityForm.get('email');
  }

  get passwordCtrl() {
    return this.identityForm.get('password');
  }
}
