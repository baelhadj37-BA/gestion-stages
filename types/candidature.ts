// types/candidature.ts

export type StatutCandidature = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface OffreRelation {
  id: string;
  titre: string;
  entreprise: string;
  description?: string;
  localisation: string;
  duree: string;
}

export interface UserRelation {
  id: string;
  nom: string;
  email: string;
}

export interface Candidature {
  id: string;
  cvUrl: string;
  statut: StatutCandidature;
  createdAt: string;
  offreId: string;
  userId?: string | null;
  offre?: OffreRelation;
  user?: UserRelation | null;
}