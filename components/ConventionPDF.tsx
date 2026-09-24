import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 130,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 200,
    height: 80,
    borderWidth: 1,
    borderColor: '#999999',
    padding: 8,
    textAlign: 'center',
    fontSize: 10,
  },
});

interface ConventionPDFProps {
  etudiantNom: string;
  etudiantEmail: string;
  entrepriseNom: string;
  intituleStage: string;
  dateValidation?: string;
}

export default function ConventionPDF({
  etudiantNom,
  etudiantEmail,
  entrepriseNom,
  intituleStage,
  dateValidation,
}: ConventionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Convention de Stage</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations Étudiant</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom & Prénom :</Text>
            <Text style={styles.value}>{etudiantNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email :</Text>
            <Text style={styles.value}>{etudiantEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Informations Entreprise & Stage</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Entreprise d'accueil :</Text>
            <Text style={styles.value}>{entrepriseNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sujet du stage :</Text>
            <Text style={styles.value}>{intituleStage}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de validation :</Text>
            <Text style={styles.value}>
              {dateValidation ? new Date(dateValidation).toLocaleDateString('fr-FR') : 'En cours'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Engagements</Text>
          <Text>
            Le présent document atteste que l'étudiant susmentionné est autorisé à effectuer son
            stage au sein de l'entreprise d'accueil dans le cadre de sa formation académique.
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text>Signature de l'Étudiant</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Cachet & Signature Administration</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}