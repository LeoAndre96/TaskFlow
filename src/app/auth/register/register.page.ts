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
  submitted: boolean = false;
  touched: { [key: string]: boolean } = {};
  fieldErrors: { [key: string]: string } = {};

  showPassword: boolean = false;
  showRepetirPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleRepetirPasswordVisibility() {
    this.showRepetirPassword = !this.showRepetirPassword;
  }

  resetForm() {
    this.form = {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      username: '',
      telefono: '',
      password: '',
      repetirPassword: ''
    };
    this.fieldErrors = {};
    this.touched = {};
    this.submitted = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.showPassword = false;
    this.showRepetirPassword = false;
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

  goBack() {
    this.resetForm();
    this.router.navigate(['/login']);
  }

  hasError(field: string): boolean {
    return !!this.fieldErrors[field];
  }

  private hasOnlyLetters(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    if (/[0-9]/.test(trimmed)) return false;
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(trimmed);
  }

  private isValidEmail(value: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(value.trim());
  }

  preventNumbers(event: KeyboardEvent) {
    if (['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete', 'Escape'].includes(event.key)) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    if (/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventNonNumeric(event: KeyboardEvent) {
    if (['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete', 'Escape'].includes(event.key)) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventSpaces(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  sanitizeLetters(event: Event, field: 'nombres' | 'apellidos') {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[0-9]/g, '').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '').slice(0, 50);
    input.value = sanitized;
    this.form[field] = sanitized;
    if (this.submitted || this.touched[field]) {
      this.validateField(field);
    }
  }

  sanitizeEmail(event: Event) {
    const input = event.target as HTMLInputElement;
    let sanitized = input.value.replace(/[^a-zA-Z0-9._@+-]/g, '').slice(0, 100);

    if ((sanitized.match(/@/g) || []).length > 1) {
      const firstAt = sanitized.indexOf('@');
      sanitized = sanitized.slice(0, firstAt + 1) + sanitized.slice(firstAt + 1).replace(/@/g, '');
    }

    input.value = sanitized;
    this.form.email = sanitized;
    if (this.submitted || this.touched['email']) {
      this.validateField('email');
    }
  }

  sanitizeNumeric(event: Event, field: 'dni' | 'telefono') {
    const input = event.target as HTMLInputElement;
    const maxLength = field === 'dni' ? 8 : 9;
    let sanitized = input.value.replace(/\D/g, '');
    if (field === 'telefono' && sanitized.length > 0 && !sanitized.startsWith('9')) {
      const idx = sanitized.indexOf('9');
      sanitized = idx !== -1 ? sanitized.substring(idx) : '';
    }
    sanitized = sanitized.slice(0, maxLength);
    input.value = sanitized;
    this.form[field] = sanitized;
    if (this.submitted || this.touched[field]) {
      this.validateField(field);
    }
  }

  onFieldInput(field: string) {
    if (this.submitted || this.touched[field]) {
      this.validateField(field);
    }
  }

  onFieldBlur(field: string) {
    this.touched[field] = true;
    this.validateField(field);
  }

  validateField(field: string): boolean {
    delete this.fieldErrors[field];

    switch (field) {
      case 'nombres':
        if (!this.form.nombres.trim()) {
          this.fieldErrors['nombres'] = 'El nombre es obligatorio.';
        } else if (/[0-9]/.test(this.form.nombres)) {
          this.fieldErrors['nombres'] = 'El nombre no debe contener números.';
        } else if (!this.hasOnlyLetters(this.form.nombres)) {
          this.fieldErrors['nombres'] = 'El nombre solo debe contener letras.';
        }
        break;

      case 'apellidos':
        if (!this.form.apellidos.trim()) {
          this.fieldErrors['apellidos'] = 'Los apellidos son obligatorios.';
        } else if (/[0-9]/.test(this.form.apellidos)) {
          this.fieldErrors['apellidos'] = 'Los apellidos no deben contener números.';
        } else if (!this.hasOnlyLetters(this.form.apellidos)) {
          this.fieldErrors['apellidos'] = 'Los apellidos solo deben contener letras.';
        }
        break;

      case 'email':
        if (!this.form.email.trim()) {
          this.fieldErrors['email'] = 'El correo electrónico es obligatorio.';
        } else if (!this.isValidEmail(this.form.email)) {
          this.fieldErrors['email'] = 'El correo debe tener el formato correo@dominio.extension';
        }
        break;

      case 'dni':
        if (!this.form.dni.trim()) {
          this.fieldErrors['dni'] = 'El DNI es obligatorio.';
        } else if (!/^\d{8}$/.test(this.form.dni.trim())) {
          this.fieldErrors['dni'] = 'El DNI debe tener exactamente 8 dígitos.';
        }
        break;

      case 'telefono':
        if (!this.form.telefono.trim()) {
          this.fieldErrors['telefono'] = 'El teléfono es obligatorio.';
        } else if (!/^\d{9}$/.test(this.form.telefono.trim())) {
          this.fieldErrors['telefono'] = 'El teléfono debe iniciar con 9 y tener exactamente 9 dígitos.';
        }
        break;

      case 'username':
        if (!this.form.username.trim()) {
          this.fieldErrors['username'] = 'El username es obligatorio.';
        } else if (this.form.username.trim().length < 3) {
          this.fieldErrors['username'] = 'El username debe tener al menos 3 caracteres.';
        }
        break;

      case 'password':
        if (!this.form.password) {
          this.fieldErrors['password'] = 'La contraseña es obligatoria.';
        } else if (this.form.password.length < 6) {
          this.fieldErrors['password'] = 'La contraseña debe tener al menos 6 caracteres.';
        }
        if (this.form.repetirPassword) {
          this.validateField('repetirPassword');
        }
        break;

      case 'repetirPassword':
        if (!this.form.repetirPassword) {
          this.fieldErrors['repetirPassword'] = 'Debe confirmar la contraseña.';
        } else if (this.form.password !== this.form.repetirPassword) {
          this.fieldErrors['repetirPassword'] = 'Las contraseñas no coinciden.';
        }
        break;
    }

    return !this.fieldErrors[field];
  }

  validateAll(): boolean {
    const fields = ['nombres', 'apellidos', 'email', 'dni', 'telefono', 'username', 'password', 'repetirPassword'];
    let allValid = true;
    for (const f of fields) {
      const ok = this.validateField(f);
      if (!ok) {
        allValid = false;
      }
    }
    return allValid;
  }

  onRegister() {
    this.errorMessage = null;
    this.successMessage = null;
    this.submitted = true;

    // Validación exhaustiva antes de enviar o presionar registrar
    const isValid = this.validateAll();
    if (!isValid) {
      this.errorMessage = 'Por favor verifique los campos marcados en rojo antes de registrar.';
      return;
    }

    this.isLoading = true;
    this.authService.register(this.form).subscribe({
      next: () => {
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
