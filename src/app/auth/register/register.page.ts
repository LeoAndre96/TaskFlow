import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent]
})
export class RegisterPage {
  form: RegisterRequest = {
    nombres: '',
    apellidos: '',
    email: '',
    dni: '',
    username: '',
    telefono: '',
    password: '',
    repetirPassword: ''
  };

  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister() {
    this.errorMessage = null;
    this.successMessage = null;

    // Validación básica de campos requeridos
    if (!this.form.nombres.trim() || !this.form.apellidos.trim() || !this.form.email.trim() ||
        !this.form.dni.trim() || !this.form.username.trim() || !this.form.telefono.trim() ||
        !this.form.password.trim() || !this.form.repetirPassword.trim()) {
      this.errorMessage = 'Por favor complete todos los campos requeridos.';
      return;
    }

    if (this.form.password !== this.form.repetirPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.form.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.authService.register(this.form).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.successMessage = '¡Usuario registrado con éxito! Redirigiendo al inicio de sesión...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al registrar el usuario.';
      }
    });
  }
}
