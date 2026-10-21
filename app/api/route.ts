import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "API Gestion des Stages - IPD Thomas Sankara",
    status: "online",
    description: "Backend API pour la gestion des stages, conventions et journaux de bord",
    endpoints: {
      auth: {
        login: "POST /api/auth/login",
        register: "POST /api/auth/register",
      },
      conventions: {
        listOrGet: "GET /api/convention(?stageId=...&statut=...)",
        create: "POST /api/convention",
        pendingCompany: "GET /api/convention/en-attente",
        pendingAdmin: "GET /api/convention/en-attente-admin",
        validateAdmin: "PATCH /api/convention/:id/admin",
        validateCompany: "PATCH /api/convention/:id/entreprise",
      },
      journal: {
        list: "GET /api/journal",
        submit: "POST /api/journal",
        pending: "GET /api/journal/en-attente",
        validate: "PATCH /api/journal/:id/validate",
        crud: "GET/POST/PUT/DELETE /api/journal/crud",
      },
      offres: {
        list: "GET /api/offres",
        create: "POST /api/offres",
      },
      stages: {
        myStages: "GET /api/stages/me",
      },
      dashboard: {
        encadreur: "GET /api/dashboard/encadreur",
      },
      verification: {
        verify: "GET /api/verify/:uuid",
      },
    },
  });
}
