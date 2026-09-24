export type StatutJournal = 'EN_ATTENTE' | 'VALIDE' | 'A_CORRIGER';

export interface JournalDeBord {
  id: string;
  semaine: number;
  activites: string;
  statut: StatutJournal;
  commentaire?: string | null;
  alerte?: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  stageId?: number | null;
}