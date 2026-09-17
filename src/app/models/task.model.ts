export interface Task {
  id?: number;
  title: string;
  description: string;
  assignedUserId?: number | null;
  assignedUserName?: string;
  assignedUserRole?: string;
  status: 'Sin asignar' | 'En curso' | 'Finalizado';
  priority?: 'Alta' | 'Media' | 'Baja';
  prioridad?: number;
  projectId?: number | null;
  projectName?: string;
}
