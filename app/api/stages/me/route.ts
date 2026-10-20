import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";

const prisma = new PrismaClient();

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user || user.role !== "ETUDIANT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const stage = await prisma.stage.findFirst({
    where: { etudiantId: user.userId },
    orderBy: { dateDebut: "desc" },
  });

  if (!stage) {
    return NextResponse.json({ error: "Aucun stage trouvé" }, { status: 404 });
  }

  return NextResponse.json(stage);
}