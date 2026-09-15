import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent]
})
export class LoginPage {
  identifier: string = '';
  password: string = '';
  showPassword: boolean = false;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  submitted: boolean = false;
  fieldErrors: { [key: string]: string } = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  resetForm() {
    this.identifier = '';
    this.password = '';
    this.fieldErrors = {};
    this.submitted = false;
    this.errorMessage = null;
    this.showPassword = false;
  }

  ionViewWillLeave() {
    this.resetForm();
  }

  ionViewWillEnter() {
    this.resetForm();
  }

  ngOnDestroy() {
    this.resetForm();
  }

  hasError(field: string): boolean {
    return !!this.fieldErrors[field];
  }

  onFieldInput(field: string) {
    if (this.submitted) {
      this.validateField(field);
    }
  }

  validateField(field: string): boolean {
    delete this.fieldErrors[field];

    if (field === 'identifier') {
      if (!this.identifier.trim()) {
        this.fieldErrors['identifier'] = 'Ingrese su correo o usuario.';
      }
    }

    if (field === 'password') {
      if (!this.password.trim()) {
        this.fieldErrors['password'] = 'Ingrese su contraseña.';
      }
    }

    return !this.fieldErrors[field];
  }

  onLogin() {
    this.errorMessage = null;
    this.submitted = true;
    this.fieldErrors = {};

    const validId = this.validateField('identifier');
    const validPass = this.validateField('password');

    if (!validId || !validPass) {
      this.errorMessage = 'Por favor complete los campos requeridos marcados en rojo.';
      return;
    }

    this.isLoading = true;
    this.authService.login({
      identifier: this.identifier,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al iniciar sesión.';
        this.fieldErrors['identifier'] = 'Verifique su correo/usuario.';
        this.fieldErrors['password'] = 'Verifique su contraseña.';
      }
    });
  }
}
