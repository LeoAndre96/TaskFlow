import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { TaskflowService } from '../services/taskflow.service';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../models/auth.model';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent]
})
export class HomePage implements OnInit {
  currentView: 'users' | 'tasks' | 'projects' | 'dashboard' = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('taskflow_active_view') as any) || 'dashboard';
  searchQuery: string = '';
  filterRole: string = 'all';
  filterStatus: string = 'all';
  mobileMenuOpen: boolean = false;

  currentUser: AuthUser | null = null;
  users: User[] = [];
  tasks: Task[] = [];
  projects: Project[] = [];

  // Lista de roles predefinidos
  rolesList: string[] = ['Admin', 'Product Owner', 'Scrum Master', 'Lead Developer', 'UX Designer', 'QA Engineer'];

  // Estado de modales
  showUserModal: boolean = false;
  editingUser: User = { name: '', email: '', role: 'Lead Developer' };
  userFormErrors: { [key: string]: string } = {};
  userTouched: { [key: string]: boolean } = {};
  showUserPassword: boolean = false;

  roleInfoList = [
    { name: 'Admin', id: 1, tag: 'Control Total', desc: 'Gestión global y permisos', icon: '👑', color: '#0d9488' },
    { name: 'Product Owner', id: 2, tag: 'Visión & Backlog', desc: 'Priorización y requerimientos', icon: '🎯', color: '#8b5cf6' },
    { name: 'Scrum Master', id: 3, tag: 'Agilidad & Sprints', desc: 'Facilitador del equipo ágil', icon: '⚡', color: '#3b82f6' },
    { name: 'Lead Developer', id: 4, tag: 'Arquitectura & Tech', desc: 'Desarrollo y soporte técnico', icon: '💻', color: '#0284c7' },
    { name: 'UX Designer', id: 5, tag: 'Diseño & UX/UI', desc: 'Prototipos y diseño visual', icon: '🎨', color: '#ec4899' },
    { name: 'QA Engineer', id: 6, tag: 'Testing & Calidad', desc: 'Pruebas y control de bugs', icon: '🧪', color: '#f59e0b' }
  ];

  showTaskModal: boolean = false;
  editingTask: Task = { title: '', description: '', assignedUserId: null, assignedUserName: 'Sin asignar', assignedUserRole: '', status: 'Sin asignar' };
  taskFormErrors: { [key: string]: string } = {};
  taskTouched: { [key: string]: boolean } = {};

  taskStatusOptions: { value: 'Sin asignar' | 'En curso' | 'Finalizado'; label: string; desc: string; color: string; icon: string }[] = [
    { value: 'Sin asignar', label: 'Sin Asignar', desc: 'Pendiente de inicio', color: '#712662', icon: '⚡' },
    { value: 'En curso', label: 'En Curso', desc: 'En desarrollo activo', color: '#38bdf8', icon: '🔄' },
    { value: 'Finalizado', label: 'Finalizado', desc: 'Completado y probado', color: '#10b981', icon: '✅' }
  ];

  taskPriorityOptions: { value: 'Alta' | 'Media' | 'Baja'; label: string; desc: string; color: string; num: number }[] = [
    { value: 'Alta', label: 'Alta', desc: 'Urgente / Crítica', color: '#ef4444', num: 1 },
    { value: 'Media', label: 'Media', desc: 'Estándar / Normal', color: '#f59e0b', num: 2 },
    { value: 'Baja', label: 'Baja', desc: 'Opcional / Menor', color: '#10b981', num: 3 }
  ];

  showProjectModal: boolean = false;
  editingProject: Project = { name: '', description: '', status: 'En progreso', participantIds: [] };

  toastMessage: string | null = null;

  constructor(
    private taskflowService: TaskflowService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(u => this.currentUser = u);
    this.loadData();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return `${this.currentUser.nombres} ${this.currentUser.apellidos}`.trim() || this.currentUser.username;
    }
    return 'Carlos Admin';
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const n = (this.currentUser.nombres || '')[0] || '';
      const a = (this.currentUser.apellidos || '')[0] || '';
      return (n + a).toUpperCase() || 'US';
    }
    return 'CA';
  }

  loadData() {
    this.taskflowService.getUsers().subscribe(data => this.users = data);
    this.taskflowService.getTasks().subscribe(data => this.tasks = data);
    this.taskflowService.getProjects().subscribe(data => this.projects = data);
  }

  switchView(view: 'users' | 'tasks' | 'projects' | 'dashboard') {
    this.currentView = view;
    this.searchQuery = '';
    this.filterRole = 'all';
    this.filterStatus = 'all';
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // ================= FILTROS =================
  get filteredUsers(): User[] {
    return this.users.filter(u => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = this.filterRole === 'all' || u.role === this.filterRole;
      return matchSearch && matchRole;
    });
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(t => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = t.title.toLowerCase().includes(q) || (t.assignedUserName && t.assignedUserName.toLowerCase().includes(q));
      const matchStatus = this.filterStatus === 'all' || t.status === this.filterStatus;
      const matchRole = this.filterRole === 'all' || t.assignedUserRole === this.filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }

  get filteredProjects(): Project[] {
    return this.projects.filter(p => {
      const q = this.searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  }

  // ================= CRUD USUARIOS =================
  getRoleId(role: string): number {
    const map: { [key: string]: number } = {
      'Admin': 1,
      'Product Owner': 2,
      'Scrum Master': 3,
      'Lead Developer': 4,
      'UX Designer': 5,
      'QA Engineer': 6
    };
    return map[role] || 4;
  }

  selectUserRole(role: string) {
    this.editingUser.role = role;
    this.editingUser.roleId = this.getRoleId(role);
    this.userTouched['role'] = true;
    this.validateUserField('role');
  }

  getEditingUserInitials(): string {
    const n = (this.editingUser.nombres || '').trim();
    const a = (this.editingUser.apellidos || '').trim();
    if (n && a) {
      return (n[0] + a[0]).toUpperCase();
    }
    if (this.editingUser.name) {
      return this.getUserInitialsFor(this.editingUser.name);
    }
    return 'NU';
  }

  openNewUserModal() {
    this.editingUser = {
      name: '',
      nombres: '',
      apellidos: '',
      email: '',
      username: '',
      dni: '',
      telefono: '',
      role: 'Lead Developer',
      roleId: 4,
      password: ''
    };
    this.userFormErrors = {};
    this.userTouched = {};
    this.showUserPassword = false;
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    if (!this.editingUser.nombres && user.name) {
      const parts = user.name.trim().split(/\s+/);
      this.editingUser.nombres = parts[0] || '';
      this.editingUser.apellidos = parts.slice(1).join(' ') || '';
    }
    if (!this.editingUser.roleId) {
      this.editingUser.roleId = this.getRoleId(this.editingUser.role);
    }
    this.userFormErrors = {};
    this.userTouched = {};
    this.showUserPassword = false;
    this.showUserModal = true;
  }

  closeUserModalOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showUserModal = false;
    }
  }

  onUserNameFieldChange() {
    const n = (this.editingUser.nombres || '').trim();
    const a = (this.editingUser.apellidos || '').trim();
    this.editingUser.name = [n, a].filter(Boolean).join(' ');
    this.validateUserField('nombres');
    this.validateUserField('apellidos');
  }

  autoSuggestUsernameAndEmail() {
    const n = (this.editingUser.nombres || '').trim();
    const a = (this.editingUser.apellidos || '').trim();
    if (!n && !a) {
      this.showToast('Ingresa nombres o apellidos para autocompletar');
      return;
    }
    const clean = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const first = clean(n.split(/\s+/)[0] || 'usuario');
    const last = clean(a.split(/\s+/)[0] || '');
    const base = last ? `${first}.${last}` : first;

    this.editingUser.username = base;
    this.editingUser.email = `${base}@taskflow.io`;

    this.userTouched['username'] = true;
    this.userTouched['email'] = true;
    this.validateUserField('username');
    this.validateUserField('email');
    this.showToast('✨ Usuario y correo autocompletados');
  }

  generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Tf';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.editingUser.password = pass;
    this.showUserPassword = true;
    this.userTouched['password'] = true;
    this.validateUserField('password');
    this.showToast('🎲 Contraseña generada');
  }

  toggleUserPasswordVisibility() {
    this.showUserPassword = !this.showUserPassword;
  }

  // --- Validaciones y Sanitizaciones ---
  onUserFieldBlur(field: string) {
    this.userTouched[field] = true;
    this.validateUserField(field);
  }

  hasUserError(field: string): boolean {
    return !!(this.userTouched[field] && this.userFormErrors[field]);
  }

  isUserFieldValid(field: string): boolean {
    if (!this.userTouched[field]) return false;
    if (this.userFormErrors[field]) return false;
    if (field === 'nombres') return !!(this.editingUser.nombres && this.editingUser.nombres.trim().length >= 2);
    if (field === 'apellidos') return !!(this.editingUser.apellidos && this.editingUser.apellidos.trim().length >= 2);
    if (field === 'email') return !!(this.editingUser.email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.editingUser.email));
    if (field === 'username') return !!(this.editingUser.username && this.editingUser.username.trim().length >= 3);
    if (field === 'dni') return !!(this.editingUser.dni && /^\d{8}$/.test(this.editingUser.dni));
    if (field === 'telefono') return !!(this.editingUser.telefono && /^9\d{8}$/.test(this.editingUser.telefono));
    if (field === 'password') return !!(this.editingUser.password && this.editingUser.password.length >= 6);
    return true;
  }

  preventNumbers(event: KeyboardEvent) {
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' '].includes(event.key)) return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventPhoneInvalidChars(event: KeyboardEvent) {
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const selStart = input.selectionStart ?? 0;

    // Si está en la primera posición o reemplazando todo, solo se permite el dígito 9
    if (selStart === 0 && event.key !== '9') {
      event.preventDefault();
      this.userFormErrors['telefono'] = 'El celular debe comenzar obligatoriamente con 9';
      this.userTouched['telefono'] = true;
      return;
    }

    const currentVal = input.value || '';
    if (currentVal.length >= 9 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
    }
  }

  sanitizePhone(event: any) {
    const target = event.target as HTMLInputElement;
    let clean = target.value.replace(/\D/g, '');

    // Si pegaron con prefijo 519...
    if (clean.startsWith('519') && clean.length > 9) {
      clean = clean.substring(2);
    }

    // Asegurar que comience con 9
    if (clean.length > 0 && !clean.startsWith('9')) {
      const idxNine = clean.indexOf('9');
      if (idxNine !== -1) {
        clean = clean.substring(idxNine);
      } else {
        clean = '';
      }
      this.userFormErrors['telefono'] = 'El celular debe comenzar obligatoriamente con 9';
      this.userTouched['telefono'] = true;
    }

    clean = clean.slice(0, 9);
    target.value = clean;
    this.editingUser.telefono = clean;
  }

  preventNonNumeric(event: KeyboardEvent) {
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  preventSpaces(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  sanitizeLetters(event: any, field: 'nombres' | 'apellidos') {
    const target = event.target;
    const clean = target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (field === 'nombres') this.editingUser.nombres = clean;
    if (field === 'apellidos') this.editingUser.apellidos = clean;
  }

  sanitizeNumeric(event: any, field: 'dni' | 'telefono') {
    const target = event.target;
    const max = field === 'dni' ? 8 : 9;
    const clean = target.value.replace(/\D/g, '').slice(0, max);
    if (field === 'dni') this.editingUser.dni = clean;
    if (field === 'telefono') this.editingUser.telefono = clean;
  }

  sanitizeEmail(event: any) {
    const target = event.target;
    this.editingUser.email = target.value.replace(/\s+/g, '');
  }

  validateUserField(field: string) {
    switch (field) {
      case 'nombres': {
        const val = (this.editingUser.nombres || '').trim();
        if (!val) {
          this.userFormErrors['nombres'] = 'Los nombres son obligatorios';
        } else if (val.length < 2) {
          this.userFormErrors['nombres'] = 'Debe tener al menos 2 caracteres';
        } else {
          delete this.userFormErrors['nombres'];
        }
        break;
      }
      case 'apellidos': {
        const val = (this.editingUser.apellidos || '').trim();
        if (!val) {
          this.userFormErrors['apellidos'] = 'Los apellidos son obligatorios';
        } else if (val.length < 2) {
          this.userFormErrors['apellidos'] = 'Debe tener al menos 2 caracteres';
        } else {
          delete this.userFormErrors['apellidos'];
        }
        break;
      }
      case 'email': {
        const val = (this.editingUser.email || '').trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!val) {
          this.userFormErrors['email'] = 'El correo es obligatorio';
        } else if (!emailRegex.test(val)) {
          this.userFormErrors['email'] = 'Formato inválido (ej. usuario@taskflow.io)';
        } else {
          delete this.userFormErrors['email'];
        }
        break;
      }
      case 'username': {
        const val = (this.editingUser.username || '').trim();
        if (!val) {
          this.userFormErrors['username'] = 'El usuario es obligatorio';
        } else if (val.length < 3) {
          this.userFormErrors['username'] = 'Mínimo 3 caracteres';
        } else if (/\s/.test(val)) {
          this.userFormErrors['username'] = 'No puede contener espacios';
        } else {
          delete this.userFormErrors['username'];
        }
        break;
      }
      case 'dni': {
        const val = (this.editingUser.dni || '').trim();
        if (val && !/^\d{8}$/.test(val)) {
          this.userFormErrors['dni'] = 'El DNI debe tener exactamente 8 dígitos';
        } else {
          delete this.userFormErrors['dni'];
        }
        break;
      }
      case 'telefono': {
        const val = (this.editingUser.telefono || '').trim();
        if (val) {
          if (!val.startsWith('9')) {
            this.userFormErrors['telefono'] = 'El celular debe comenzar obligatoriamente con 9';
          } else if (val.length !== 9) {
            this.userFormErrors['telefono'] = `Debe tener exactamente 9 dígitos (ingresados: ${val.length}/9)`;
          } else {
            delete this.userFormErrors['telefono'];
          }
        } else {
          delete this.userFormErrors['telefono'];
        }
        break;
      }
      case 'password': {
        if (!this.editingUser.id) {
          const val = this.editingUser.password || '';
          if (!val) {
            this.userFormErrors['password'] = 'La contraseña inicial es requerida';
          } else if (val.length < 6) {
            this.userFormErrors['password'] = 'Mínimo 6 caracteres';
          } else {
            delete this.userFormErrors['password'];
          }
        } else {
          delete this.userFormErrors['password'];
        }
        break;
      }
      case 'role': {
        if (!this.editingUser.role) {
          this.userFormErrors['role'] = 'Selecciona un rol para el integrante';
        } else {
          delete this.userFormErrors['role'];
        }
        break;
      }
    }
  }

  validateAllUserFields(): boolean {
    ['nombres', 'apellidos', 'email', 'username', 'role'].forEach(f => this.validateUserField(f));
    if (!this.editingUser.id) {
      this.validateUserField('password');
    }
    if (this.editingUser.dni) this.validateUserField('dni');
    if (this.editingUser.telefono) this.validateUserField('telefono');
    return Object.keys(this.userFormErrors).length === 0;
  }

  saveUser() {
    ['nombres', 'apellidos', 'email', 'username', 'role'].forEach(f => this.userTouched[f] = true);
    if (!this.editingUser.id) {
      this.userTouched['password'] = true;
    }
    if (this.editingUser.dni) this.userTouched['dni'] = true;
    if (this.editingUser.telefono) this.userTouched['telefono'] = true;

    if (!this.validateAllUserFields()) {
      this.showToast('⚠️ Corrige los errores en el formulario');
      return;
    }

    const n = (this.editingUser.nombres || '').trim();
    const a = (this.editingUser.apellidos || '').trim();
    this.editingUser.name = [n, a].filter(Boolean).join(' ') || this.editingUser.name;
    this.editingUser.roleId = this.getRoleId(this.editingUser.role);

    this.taskflowService.saveUser(this.editingUser).subscribe(() => {
      this.loadData();
      this.showUserModal = false;
      this.showToast(this.editingUser.id ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
    });
  }

  deleteUser(id?: number) {
    if (!id) return;
    if (confirm('¿Eliminar este usuario?')) {
      this.taskflowService.deleteUser(id).subscribe(() => {
        this.loadData();
        this.showToast('Usuario eliminado');
      });
    }
  }

  // ================= CRUD TAREAS =================
  getTaskStatusColor(status?: string): string {
    const map: { [key: string]: string } = {
      'En curso': '#38bdf8',
      'Finalizado': '#10b981',
      'Sin asignar': '#712662'
    };
    return map[status || 'Sin asignar'] || '#712662';
  }

  openNewTaskModal() {
    this.editingTask = {
      title: '',
      description: '',
      assignedUserId: null,
      assignedUserName: 'Sin asignar',
      assignedUserRole: '',
      status: 'Sin asignar',
      priority: 'Media',
      prioridad: 2,
      projectId: this.projects.length > 0 ? this.projects[0].id : null,
      projectName: this.projects.length > 0 ? this.projects[0].name : ''
    };
    this.taskFormErrors = {};
    this.taskTouched = {};
    this.showTaskModal = true;
  }

  editTask(task: Task) {
    this.editingTask = { ...task };
    if (!this.editingTask.priority) {
      this.editingTask.priority = this.editingTask.prioridad === 1 ? 'Alta' : this.editingTask.prioridad === 3 ? 'Baja' : 'Media';
    }
    this.taskFormErrors = {};
    this.taskTouched = {};
    this.showTaskModal = true;
  }

  closeTaskModalOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showTaskModal = false;
    }
  }

  selectTaskStatus(status: 'Sin asignar' | 'En curso' | 'Finalizado') {
    this.editingTask.status = status;
    this.taskTouched['status'] = true;
  }

  selectTaskPriority(priority: 'Alta' | 'Media' | 'Baja') {
    this.editingTask.priority = priority;
    this.editingTask.prioridad = priority === 'Alta' ? 1 : priority === 'Baja' ? 3 : 2;
  }

  onTaskUserSelect() {
    if (this.editingTask.assignedUserId) {
      const u = this.users.find(user => user.id === Number(this.editingTask.assignedUserId));
      this.editingTask.assignedUserName = u ? u.name : 'Sin asignar';
      this.editingTask.assignedUserRole = u ? u.role : '';
      if (this.editingTask.status === 'Sin asignar') {
        this.editingTask.status = 'En curso';
      }
    } else {
      this.editingTask.assignedUserName = 'Sin asignar';
      this.editingTask.assignedUserRole = '';
    }
  }

  assignTaskToCurrentUser() {
    if (this.currentUser) {
      const match = this.users.find(u => u.email === this.currentUser?.email) || this.users[0];
      if (match) {
        this.editingTask.assignedUserId = match.id || null;
        this.onTaskUserSelect();
        this.showToast(`Asignado a ${match.name}`);
      }
    }
  }

  validateTaskField(field: string) {
    if (field === 'title') {
      const val = (this.editingTask.title || '').trim();
      if (!val) {
        this.taskFormErrors['title'] = 'El título de la tarea es obligatorio';
      } else if (val.length < 3) {
        this.taskFormErrors['title'] = 'El título debe tener al menos 3 caracteres';
      } else {
        delete this.taskFormErrors['title'];
      }
    }
  }

  hasTaskError(field: string): boolean {
    return !!(this.taskTouched[field] && this.taskFormErrors[field]);
  }

  isTaskFieldValid(field: string): boolean {
    return !!(this.taskTouched[field] && !this.taskFormErrors[field] && this.editingTask.title?.trim().length >= 3);
  }

  saveTask() {
    this.taskTouched['title'] = true;
    this.validateTaskField('title');

    if (Object.keys(this.taskFormErrors).length > 0 || !this.editingTask.title?.trim()) {
      this.showToast('⚠️ Ingresa un título válido para la tarea');
      return;
    }

    this.onTaskUserSelect();

    if (this.editingTask.projectId) {
      const p = this.projects.find(proj => proj.id === Number(this.editingTask.projectId));
      this.editingTask.projectName = p ? p.name : '';
    }

    this.taskflowService.saveTask(this.editingTask).subscribe(() => {
      this.loadData();
      this.showTaskModal = false;
      this.showToast(this.editingTask.id ? 'Tarea actualizada con éxito' : 'Tarea creada con éxito');
    });
  }

  deleteTask(id?: number) {
    if (!id) return;
    if (confirm('¿Eliminar esta tarea?')) {
      this.taskflowService.deleteTask(id).subscribe(() => {
        this.loadData();
        this.showToast('Tarea eliminada');
      });
    }
  }

  toggleTaskStatus(task: Task) {
    if (task.status === 'Sin asignar') {
      task.status = 'En curso';
    } else if (task.status === 'En curso') {
      task.status = 'Finalizado';
    } else {
      task.status = 'Sin asignar';
    }

    this.taskflowService.saveTask(task).subscribe(() => {
      this.loadData();
      this.showToast(`Estado: ${task.status}`);
    });
  }

  // Helper para obtener rol del usuario asignado
  getUserRole(userId?: number | null): string {
    if (!userId) return '';
    const u = this.users.find(user => user.id === userId);
    return u ? u.role : '';
  }

  // ================= CRUD PROYECTOS =================
  projectStatusOptions: { value: 'Planificación' | 'En progreso' | 'Finalizado'; label: string; desc: string; color: string }[] = [
    { value: 'Planificación', label: 'Planificación', desc: 'Fase inicial y diseño', color: '#f59e0b' },
    { value: 'En progreso', label: 'En progreso', desc: 'Ejecución activa', color: '#38bdf8' },
    { value: 'Finalizado', label: 'Finalizado', desc: 'Completado con éxito', color: '#10b981' }
  ];

  getProjectStatusColor(status?: string): string {
    const map: { [key: string]: string } = {
      'En progreso': '#38bdf8',
      'Finalizado': '#10b981',
      'Planificación': '#f59e0b'
    };
    return map[status || 'En progreso'] || '#38bdf8';
  }

  selectProjectStatus(status: 'Planificación' | 'En progreso' | 'Finalizado') {
    this.editingProject.status = status;
  }

  openNewProjectModal() {
    this.editingProject = { name: '', description: '', status: 'En progreso', participantIds: [] };
    this.showProjectModal = true;
  }

  editProject(proj: Project) {
    this.editingProject = { ...proj, participantIds: [...(proj.participantIds || [])] };
    this.showProjectModal = true;
  }

  closeProjectModalOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showProjectModal = false;
    }
  }

  isParticipantSelected(userId?: number): boolean {
    if (!userId) return false;
    return this.editingProject.participantIds?.includes(userId) || false;
  }

  toggleParticipant(userId?: number) {
    if (!userId) return;
    if (!this.editingProject.participantIds) this.editingProject.participantIds = [];
    const idx = this.editingProject.participantIds.indexOf(userId);
    if (idx !== -1) {
      this.editingProject.participantIds.splice(idx, 1);
    } else {
      this.editingProject.participantIds.push(userId);
    }
  }

  saveProject() {
    if (!this.editingProject.name?.trim()) {
      this.showToast('⚠️ Ingresa el nombre del proyecto');
      return;
    }

    this.taskflowService.saveProject(this.editingProject).subscribe(() => {
      this.loadData();
      this.showProjectModal = false;
      this.showToast(this.editingProject.id ? 'Proyecto actualizado con éxito' : 'Proyecto creado con éxito');
    });
  }

  deleteProject(id?: number) {
    if (!id) return;
    if (confirm('¿Eliminar este proyecto?')) {
      this.taskflowService.deleteProject(id).subscribe(() => {
        this.loadData();
        this.showToast('Proyecto eliminado');
      });
    }
  }

  getParticipantList(participantIds: number[] = []): { id: number; name: string; cleanName: string; role: string; initials: string; color: string }[] {
    const roleColors: { [role: string]: string } = {
      'Admin': '#0d9488',
      'Product Owner': '#8b5cf6',
      'Scrum Master': '#3b82f6',
      'Lead Developer': '#0284c7',
      'UX Designer': '#ec4899',
      'QA Engineer': '#f59e0b'
    };

    return this.users
      .filter(u => participantIds.includes(u.id || 0))
      .map(u => {
        const regex = new RegExp('\\s*' + u.role + '$', 'i');
        const clean = u.name.replace(regex, '').trim() || u.name;
        const parts = clean.split(/\s+/);
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : clean.substring(0, 2).toUpperCase();
        return {
          id: u.id || 0,
          name: u.name,
          cleanName: clean,
          role: u.role,
          initials: initials,
          color: roleColors[u.role] || '#64748b'
        };
      });
  }

  // ================= TOAST =================
  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 2500);
  }

  // Resumen métricas
  get roleSummary(): string {
    const counts: { [role: string]: number } = {};
    this.filteredUsers.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return Object.entries(counts).map(([r, c]) => `${r}: ${c}`).join(' | ') || 'Ninguno';
  }

  get tasksInProgressCount(): number {
    return this.tasks.filter(t => t.status === 'En curso').length;
  }

  get tasksCompletedCount(): number {
    return this.tasks.filter(t => t.status === 'Finalizado').length;
  }

  get tasksUnassignedCount(): number {
    return this.tasks.filter(t => t.status === 'Sin asignar').length;
  }

  get projectsInProgressCount(): number {
    return this.projects.filter(p => p.status === 'En progreso').length;
  }

  get projectsCompletedCount(): number {
    return this.projects.filter(p => p.status === 'Finalizado').length;
  }

  // ================= MÉTRICAS Y GRÁFICOS (DASHBOARD) =================
  get taskCompletionPercentage(): number {
    if (!this.tasks.length) return 0;
    return Math.round((this.tasksCompletedCount / this.tasks.length) * 100);
  }

  get taskInProgressPercentage(): number {
    if (!this.tasks.length) return 0;
    return Math.round((this.tasksInProgressCount / this.tasks.length) * 100);
  }

  get taskUnassignedPercentage(): number {
    if (!this.tasks.length) return 0;
    return Math.max(0, 100 - this.taskCompletionPercentage - this.taskInProgressPercentage);
  }

  get donutChartConicStyle(): string {
    const pCompleted = this.taskCompletionPercentage;
    const pInProgress = this.taskInProgressPercentage;
    const endCompleted = pCompleted;
    const endInProgress = pCompleted + pInProgress;
    return "conic-gradient(#10b981 0% " + endCompleted + "%, #38bdf8 " + endCompleted + "% " + endInProgress + "%, #712662 " + endInProgress + "% 100%)";
  }

  get tasksByRole(): { role: string; count: number; percentage: number; color: string }[] {
    const counts: { [role: string]: number } = {};
    this.rolesList.forEach(r => counts[r] = 0);
    this.tasks.forEach(t => {
      if (t.assignedUserRole && counts[t.assignedUserRole] !== undefined) {
        counts[t.assignedUserRole]++;
      }
    });

    const max = Math.max(...Object.values(counts), 1);
    const colors = ['#712662', '#23345C', '#1A355E', '#9d3587', '#38bdf8', '#10b981'];

    return this.rolesList.map((r, i) => ({
      role: r,
      count: counts[r] || 0,
      percentage: Math.round(((counts[r] || 0) / max) * 100),
      color: colors[i % colors.length]
    }));
  }

  get projectProgressList(): { name: string; status: string; progress: number; participantsCount: number; color: string }[] {
    return this.projects.map((p, idx) => {
      let progress = 45;
      let color = '#23345C';
      if (p.status === 'Finalizado') {
        progress = 100;
        color = '#10b981';
      } else if (p.status === 'En progreso') {
        progress = idx === 0 ? 80 : 50;
        color = '#712662';
      } else {
        progress = 25;
        color = '#f59e0b';
      }
      return {
        name: p.name,
        status: p.status,
        progress: progress,
        participantsCount: p.participantIds?.length || 0,
        color: color
      };
    });
  }

  getTaskAssigneeInfo(task: Task): { name: string; cleanName: string; role: string; initials: string; color: string } | null {
    if (!task.assignedUserId && (!task.assignedUserName || task.assignedUserName === 'Sin asignar')) {
      return null;
    }
    const role = task.assignedUserRole || this.getUserRole(task.assignedUserId) || '';
    const rawName = task.assignedUserName || 'Usuario';
    const regex = new RegExp('\\s*' + role + '$', 'i');
    const clean = rawName.replace(regex, '').trim() || rawName;
    const parts = clean.split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : clean.substring(0, 2).toUpperCase();

    const roleColors: { [role: string]: string } = {
      'Admin': '#0d9488',
      'Product Owner': '#8b5cf6',
      'Scrum Master': '#3b82f6',
      'Lead Developer': '#0284c7',
      'UX Designer': '#ec4899',
      'QA Engineer': '#f59e0b'
    };

    return {
      name: rawName,
      cleanName: clean,
      role: role,
      initials: initials,
      color: roleColors[role] || '#64748b'
    };
  }


  getUserTaskCount(userId?: number): number {
    if (!userId) return 0;
    return this.tasks.filter(t => t.assignedUserId === userId).length;
  }

  getUserInitialsFor(name: string): string {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  getUserRoleColor(role: string): string {
    const roleColors: { [role: string]: string } = {
      'Admin': '#0d9488',
      'Product Owner': '#8b5cf6',
      'Scrum Master': '#3b82f6',
      'Lead Developer': '#0284c7',
      'UX Designer': '#ec4899',
      'QA Engineer': '#f59e0b'
    };
    return roleColors[role] || '#64748b';
  }

  get rolesBreakdown(): { role: string; count: number; color: string }[] {
    const counts: { [role: string]: number } = {};
    this.rolesList.forEach(r => counts[r] = 0);
    this.users.forEach(u => {
      if (counts[u.role] !== undefined) {
        counts[u.role]++;
      }
    });
    return this.rolesList
      .filter(r => (counts[r] || 0) > 0)
      .map(r => ({
        role: r,
        count: counts[r] || 0,
        color: this.getUserRoleColor(r)
      }));
  }

}