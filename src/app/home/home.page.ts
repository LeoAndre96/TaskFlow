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

  showTaskModal: boolean = false;
  editingTask: Task = { title: '', description: '', assignedUserId: null, assignedUserName: 'Sin asignar', assignedUserRole: '', status: 'Sin asignar' };

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
  openNewUserModal() {
    this.editingUser = { name: '', email: '', role: 'Lead Developer' };
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.showUserModal = true;
  }

  saveUser() {
    if (!this.editingUser.name || !this.editingUser.role) {
      alert('Por favor ingresa el nombre y el rol');
      return;
    }
    if (!this.editingUser.email) {
      this.editingUser.email = `${this.editingUser.name.toLowerCase().replace(/\s+/g, '.')}@taskflow.io`;
    }

    this.taskflowService.saveUser(this.editingUser).subscribe(() => {
      this.loadData();
      this.showUserModal = false;
      this.showToast(this.editingUser.id ? 'Usuario actualizado' : 'Usuario creado');
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
  openNewTaskModal() {
    this.editingTask = { title: '', description: '', assignedUserId: null, assignedUserName: 'Sin asignar', assignedUserRole: '', status: 'Sin asignar' };
    this.showTaskModal = true;
  }

  editTask(task: Task) {
    this.editingTask = { ...task };
    this.showTaskModal = true;
  }

  saveTask() {
    if (!this.editingTask.title) {
      alert('Por favor ingresa el título de la tarea');
      return;
    }

    if (this.editingTask.assignedUserId) {
      const user = this.users.find(u => u.id === Number(this.editingTask.assignedUserId));
      this.editingTask.assignedUserName = user ? user.name : 'Sin asignar';
      this.editingTask.assignedUserRole = user ? user.role : '';
      if (this.editingTask.status === 'Sin asignar') {
        this.editingTask.status = 'En curso';
      }
    } else {
      this.editingTask.assignedUserName = 'Sin asignar';
      this.editingTask.assignedUserRole = '';
    }

    this.taskflowService.saveTask(this.editingTask).subscribe(() => {
      this.loadData();
      this.showTaskModal = false;
      this.showToast(this.editingTask.id ? 'Tarea actualizada' : 'Tarea creada');
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
  openNewProjectModal() {
    this.editingProject = { name: '', description: '', status: 'En progreso', participantIds: [] };
    this.showProjectModal = true;
  }

  editProject(proj: Project) {
    this.editingProject = { ...proj, participantIds: [...(proj.participantIds || [])] };
    this.showProjectModal = true;
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
    if (!this.editingProject.name) {
      alert('Por favor ingresa el nombre del proyecto');
      return;
    }

    this.taskflowService.saveProject(this.editingProject).subscribe(() => {
      this.loadData();
      this.showProjectModal = false;
      this.showToast(this.editingProject.id ? 'Proyecto actualizado' : 'Proyecto creado');
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
    return "conic-gradient(#10b981 0% " + endCompleted + "%, #22d3ee " + endCompleted + "% " + endInProgress + "%, #334155 " + endInProgress + "% 100%)";
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
    const colors = ['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
      let color = '#22d3ee';
      if (p.status === 'Finalizado') {
        progress = 100;
        color = '#10b981';
      } else if (p.status === 'En progreso') {
        progress = idx === 0 ? 80 : 50;
        color = '#22d3ee';
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