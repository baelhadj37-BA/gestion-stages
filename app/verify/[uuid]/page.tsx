import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  const document = await prisma.document.findUnique({
    where: { uuid },
    include: {
      stage: {
        include: {
          etudiant: { select: { nom: true, prenom: true } },
        },
      },
    },
  });

  if (!document) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>
        <h1 style={{ color: "#c0392b" }}>❌ Document invalide</h1>
        <p>Aucun document ne correspond à cet identifiant. Ce document est peut-être falsifié.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>
      <h1 style={{ color: "#27ae60" }}>✅ Document authentique</h1>
      <table style={{ margin: "20px auto", textAlign: "left" }}>
        <tbody>
          <tr>
            <td><b>Type de document :</b></td>
            <td>{document.type}</td>
          </tr>
          <tr>
            <td><b>Étudiant :</b></td>
            <td>{document.stage.etudiant.prenom} {document.stage.etudiant.nom}</td>
          </tr>
          <tr>
            <td><b>Date de génération :</b></td>
            <td>{document.dateGeneration.toLocaleDateString("fr-FR")}</td>
          </tr>
          <tr>
            <td><b>Identifiant :</b></td>
            <td>{document.uuid}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}