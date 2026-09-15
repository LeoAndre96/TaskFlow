import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recover',
  templateUrl: './recover.page.html',
  styleUrls: ['./recover.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent]
})
export class RecoverPage {
  currentStep: 1 | 2 | 3 = 1;

  email: string = '';
  code: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  generatedCodeNotice: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goBack() {
    this.errorMessage = null;
    if (this.currentStep === 1) {
      this.router.navigate(['/login']);
    } else if (this.currentStep === 2) {
      this.currentStep = 1;
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
    }
  }

  // PASO 1: Solicitar código con Correo
  onSubmitStep1() {
    this.errorMessage = null;
    this.generatedCodeNotice = null;

    if (!this.email.trim()) {
      this.errorMessage = 'Por favor ingrese su correo electrónico.';
      return;
    }

    this.isLoading = true;
    this.authService.requestRecoveryCode(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.generatedCodeNotice = `Código de seguridad: ${res.code}`;
        this.code = res.code; // Autocompletado para comodidad de prueba dinámica
        this.currentStep = 2;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al solicitar el código.';
      }
    });
  }

  // PASO 2: Validar Código
  onSubmitStep2() {
    this.errorMessage = null;

    if (!this.code.trim()) {
      this.errorMessage = 'Por favor ingrese el código de 6 dígitos.';
      return;
    }

    this.isLoading = true;
    this.authService.verifyRecoveryCode(this.email, this.code).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 3;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Código incorrecto.';
      }
    });
  }

  // PASO 3: Restablecer Contraseña
  onSubmitStep3() {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = 'Por favor ingrese y confirme su nueva contraseña.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Contraseña restablecida exitosamente! Redirigiendo a Login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al restablecer la contraseña.';
      }
    });
  }
}
