import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class TaskflowService {
  private apiUrl = 'http://localhost:8080/api';

  private defaultUsers: User[] = [
    { id: 1, name: 'Carlos Admin', email: 'carlos.admin@taskflow.io', role: 'Admin', roleId: 1 },
    { id: 2, name: 'Mariana Product Owner', email: 'mariana.po@taskflow.io', role: 'Product Owner', roleId: 2 },
    { id: 3, name: 'Ana Scrum Master', email: 'ana.sm@taskflow.io', role: 'Scrum Master', roleId: 3 },
    { id: 4, name: 'David Lead Developer', email: 'david.dev@taskflow.io', role: 'Lead Developer', roleId: 4 },
    { id: 5, name: 'Lucía UX Designer', email: 'lucia.design@taskflow.io', role: 'UX Designer', roleId: 5 },
    { id: 6, name: 'Mateo QA Specialist', email: 'mateo.qa@taskflow.io', role: 'QA Engineer', roleId: 6 }
  ];

  private defaultTasks: Task[] = [
    { id: 1, title: 'Integrar webhook para confirmación en tiempo real', description: 'Recepción y validación de firma criptográfica de pasarela QR.', assignedUserId: 1, assignedUserName: 'Carlos Admin', assignedUserRole: 'Admin', status: 'En curso' },
    { id: 2, title: 'Diseño de interfaz de cobro con QR móvil', description: 'Crear componentes accesibles y diseño responsive.', assignedUserId: 5, assignedUserName: 'Lucía UX Designer', assignedUserRole: 'UX Designer', status: 'Finalizado' },
    { id: 3, title: 'Optimización de consultas SQL en liquidaciones', description: 'Indexación y paginación en consultas de base de datos.', assignedUserId: 4, assignedUserName: 'David Lead Developer', assignedUserRole: 'Lead Developer', status: 'En curso' },
    { id: 4, title: 'Pruebas de estrés de 1,000 tx/segundo', description: 'Simulación de carga masiva para pasarela de pagos.', assignedUserId: 6, assignedUserName: 'Mateo QA Specialist', assignedUserRole: 'QA Engineer', status: 'En curso' },
    { id: 5, title: 'Redacción de manual de integración para comercios', description: 'Guía paso a paso con ejemplos en cURL y Java 17.', assignedUserId: null, assignedUserName: 'Sin asignar', assignedUserRole: '', status: 'Sin asignar' },
    { id: 6, title: 'Definición del backlog para siguiente entrega', description: 'Priorización de requerimientos con stakeholders.', assignedUserId: 2, assignedUserName: 'Mariana Product Owner', assignedUserRole: 'Product Owner', status: 'Finalizado' },
    { id: 7, title: 'Auditoría de seguridad y cifrado TLS 1.3', description: 'Revisión de certificados SSL y protección de endpoints.', assignedUserId: null, assignedUserName: 'Sin asignar', assignedUserRole: '', status: 'Sin asignar' }
  ];

  private defaultProjects: Project[] = [
    { id: 1, name: 'Pasarela de Pagos QR', description: 'Plataforma de procesamiento de cobros QR dinámicos con conciliación bancaria y liquidación automática.', status: 'En progreso', participantIds: [1, 2, 3, 4, 5, 6] },
    { id: 2, name: 'Banca Móvil 2.0', description: 'Aplicación móvil nativa para transferencias interbancarias inmediatas y token de seguridad.', status: 'En progreso', participantIds: [1, 4, 5] },
    { id: 3, name: 'Portal Backoffice Operaciones', description: 'Panel de control administrativo para supervisión de fraudes y reportería contable en tiempo real.', status: 'Finalizado', participantIds: [2, 3, 4, 6] }
  ];

  constructor(private http: HttpClient) {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (!localStorage.getItem('taskflow_ng_v3')) {
      localStorage.setItem('taskflow_ng_users', JSON.stringify(this.defaultUsers));
      localStorage.setItem('taskflow_ng_tasks', JSON.stringify(this.defaultTasks));
      localStorage.setItem('taskflow_ng_projects', JSON.stringify(this.defaultProjects));
      localStorage.setItem('taskflow_ng_v3', 'true');
    }
  }

  // ==================== USUARIOS ====================
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      catchError(() => of(JSON.parse(localStorage.getItem('taskflow_ng_users') || '[]')))
    );
  }

  saveUser(user: User): Observable<User> {
    const localUsers: User[] = JSON.parse(localStorage.getItem('taskflow_ng_users') || '[]');
    if (user.id) {
      const idx = localUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) localUsers[idx] = user;
    } else {
      user.id = localUsers.length > 0 ? Math.max(...localUsers.map(u => u.id || 0)) + 1 : 1;
      localUsers.push(user);
    }
    localStorage.setItem('taskflow_ng_users', JSON.stringify(localUsers));

    if (user.id) {
      return this.http.put<User>(`${this.apiUrl}/users/${user.id}`, user).pipe(catchError(() => of(user)));
    } else {
      return this.http.post<User>(`${this.apiUrl}/users`, user).pipe(catchError(() => of(user)));
    }
  }

  deleteUser(id: number): Observable<boolean> {
    const localUsers: User[] = JSON.parse(localStorage.getItem('taskflow_ng_users') || '[]');
    const filtered = localUsers.filter(u => u.id !== id);
    localStorage.setItem('taskflow_ng_users', JSON.stringify(filtered));

    return this.http.delete<boolean>(`${this.apiUrl}/users/${id}`).pipe(catchError(() => of(true)));
  }

  // ==================== TAREAS ====================
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`).pipe(
      catchError(() => of(JSON.parse(localStorage.getItem('taskflow_ng_tasks') || '[]')))
    );
  }

  saveTask(task: Task): Observable<Task> {
    const localTasks: Task[] = JSON.parse(localStorage.getItem('taskflow_ng_tasks') || '[]');
    if (task.id) {
      const idx = localTasks.findIndex(t => t.id === task.id);
      if (idx !== -1) localTasks[idx] = task;
    } else {
      task.id = localTasks.length > 0 ? Math.max(...localTasks.map(t => t.id || 0)) + 1 : 1;
      localTasks.push(task);
    }
    localStorage.setItem('taskflow_ng_tasks', JSON.stringify(localTasks));

    if (task.id) {
      return this.http.put<Task>(`${this.apiUrl}/tasks/${task.id}`, task).pipe(catchError(() => of(task)));
    } else {
      return this.http.post<Task>(`${this.apiUrl}/tasks`, task).pipe(catchError(() => of(task)));
    }
  }

  deleteTask(id: number): Observable<boolean> {
    const localTasks: Task[] = JSON.parse(localStorage.getItem('taskflow_ng_tasks') || '[]');
    const filtered = localTasks.filter(t => t.id !== id);
    localStorage.setItem('taskflow_ng_tasks', JSON.stringify(filtered));

    return this.http.delete<boolean>(`${this.apiUrl}/tasks/${id}`).pipe(catchError(() => of(true)));
  }

  // ==================== PROYECTOS ====================
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
      catchError(() => of(JSON.parse(localStorage.getItem('taskflow_ng_projects') || '[]')))
    );
  }

  saveProject(project: Project): Observable<Project> {
    const localProjects: Project[] = JSON.parse(localStorage.getItem('taskflow_ng_projects') || '[]');
    if (project.id) {
      const idx = localProjects.findIndex(p => p.id === project.id);
      if (idx !== -1) localProjects[idx] = project;
    } else {
      project.id = localProjects.length > 0 ? Math.max(...localProjects.map(p => p.id || 0)) + 1 : 1;
      localProjects.push(project);
    }
    localStorage.setItem('taskflow_ng_projects', JSON.stringify(localProjects));

    if (project.id) {
      return this.http.put<Project>(`${this.apiUrl}/projects/${project.id}`, project).pipe(catchError(() => of(project)));
    } else {
      return this.http.post<Project>(`${this.apiUrl}/projects`, project).pipe(catchError(() => of(project)));
    }
  }

  deleteProject(id: number): Observable<boolean> {
    const localProjects: Project[] = JSON.parse(localStorage.getItem('taskflow_ng_projects') || '[]');
    const filtered = localProjects.filter(p => p.id !== id);
    localStorage.setItem('taskflow_ng_projects', JSON.stringify(filtered));

    return this.http.delete<boolean>(`${this.apiUrl}/projects/${id}`).pipe(catchError(() => of(true)));
  }
}
