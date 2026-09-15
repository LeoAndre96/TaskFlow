export interface Project {
  id?: number;
  name: string;
  description: string;
  status: 'Planificación' | 'En progreso' | 'Finalizado';
  participantIds: number[];
}
