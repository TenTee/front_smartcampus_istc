"use client";

import React, { forwardRef } from "react";
import { Box } from "@mui/material";
import logoIstc from "../../../public/logoistc.png";
import logoIsare from "../../../public/logoisare.png";
import stamp from "../../../public/stamp.png";

const NAVY = "#061b57";
const ORANGE = "#c56b26";
const MAX_ROWS = 6;

/**
 * Version imprimable du relevé. Les dimensions sont volontairement définies en
 * millimètres pour conserver le gabarit A4 du modèle fourni lors de l'export PDF.
 */
const ReleveNotesTemplate = forwardRef(function ReleveNotesTemplate({ data }, ref) {
  if (!data) return null;

  const { etablissement = {}, etudiant = {}, semestres = [], parametres = {} } = data;
  const semesters = ["Semestre 1", "Semestre 2"].map((session) =>
    semestres.find((semester) => semester.session === session) || { session, notes: [] },
  );
  const logo = etablissement.logo_entete || etablissement.logo;

  return (
    <Box ref={ref} sx={pageStyle}>
      <header style={headerStyle}>
        <div style={institutionLogoStyle}>
          {logo ? <img src={logoIstc.src} alt="Logo de l'établissement" style={logoStyle} /> : <div style={logoFallbackStyle}>ISTC</div>}
        </div>
        <div style={institutionNameStyle}>
          <strong> ISTC – Institut Supérieur de Technologie et de Commerce</strong>
          <span>Établissement Privé d’Enseignement Supérieur</span>
          <span>Sous la Tutelle Académique de <b>THE UNIVERSITY OF BAMENDA</b></span>

        </div>
        <div style={institutionLogoStyle}>
          {<img src={logoIsare.src} alt="Logo de l'établissement" style={logoStyle} /> }
        </div>
        <div style={contactLineStyle}>
          <span>⌖ &nbsp; Agrément N° : 22-01965/L/MINESUP/SG/DDES/ESUP/SDA/AOSB</span>
          <span>✉ &nbsp; {etablissement.email || "contact@isare-istc.education"}</span>
          <span>☎ &nbsp; {etablissement.telephone || "+237 654346776 / 677606398 / 655480304"}</span>
          <span>{etablissement.adresse || "P.O 5084, Yaoundé, Cameroun"} &nbsp;&nbsp; ◉ &nbsp; {etablissement.site_web || "www.isare-istc.education"}</span>
        </div>
      </header>

      <div style={ruleStyle} />
      <div style={noticeStyle}>
        <strong style={noticeTitleStyle}>RELEVÉ DE NOTES PROVISOIRE</strong>
        <span style={noticeTextStyle}>Ce relevé est provisoire et établi à titre indicatif.<br />Le relevé de notes officiel sera délivré par la Tutelle Académique.</span>
      </div>

      <section style={identityStyle}>
        <InfoCell label="NOM DE L’ÉTUDIANT" value={etudiant.nom} width="35%" />
        <InfoCell label="NUMÉRO D’ÉTUDIANT" value={etudiant.matricule} width="28%" />
        <InfoCell label="DATE D’ÉDITION" value={new Date().toLocaleDateString("fr-FR")} width="37%" />
        <InfoCell label="DATE DE NAISSANCE" value={etudiant.date_naissance} width="18.5%" />
        <InfoCell label="LIEU DE NAISSANCE" value={etudiant.lieu_naissance} width="17%" />
        <InfoCell label="SEXE" value={etudiant.sexe} width="10%" />
        <InfoCell label="DERNIER ÉTABLISSEMENT FRÉQUENTÉ" value={etudiant.dernier_etablissement} width="34.5%" />
        <InfoCell label="DATE D’INSCRIPTION" value={etudiant.date_inscription} width="20%" />
      </section>

      <section style={detailsStyle}>
        <div style={academicDetailsStyle}>
          <Detail label="FACULTÉ" value={etudiant.faculte} />
          <Detail label="DÉPARTEMENT" value={etudiant.departement} />
          <Detail label="MAJOR" value={etudiant.filiere} />
          <Detail label="DIPLÔME VISÉ" value={etudiant.diplome_vise} />
          <Detail label="DIPLÔME CONFÉRÉ" value={etudiant.diplome_confere} />
          <Detail label="DATE DE REMISE DU DIPLÔME" value={etudiant.date_remise_diplome} />
        </div>
        <DetailBox title="ADRESSE DE L’ÉTUDIANT" value={etudiant.contact} />
        <DetailBox title="ADRESSE DU PARENT / TUTEUR" value={etudiant.parent_tuteur} />
        <div style={gradingStyle}><b>SYSTÈME DE NOTATION</b><div>A : 4.0GP : 80 – 100%</div><div>B+ : 3.5GP : 70 – 79%</div><div>B : 3.0GP : 60 – 69%</div><div>C+ : 2.5GP : 55 – 59%</div><div>C : 2.0GP : 50 – 54%</div><div>D+ : 1.5GP : 45 – 49%</div><div>D : 1.0GP : 40 – 44%</div><div>F : 0.0GP : 0 – 39%</div></div>
        <div style={keyStyle}><b>LÉGENDE (KEY)</b><div>W : Withdraw</div><div>I : Incomplete</div><div>X : Absent from Exams</div><div>N : No Credit</div><div>C : Compulsory</div><div>E : Elective</div><div>R : University Requirement</div><div>NS : Normal Session</div><div>RS : Re-sit Session</div></div>
      </section>

      {semesters.map((semester) => <SemesterTable key={semester.session} semester={semester} />)}

      <footer style={footerStyle}>
        <div style={warningStyle}>NB : Ce relevé est un document provisoire et n’a aucune valeur officielle.<br />Toute falsification ou modification est passible de poursuites.</div>
        <div style={signaturesStyle}>
          <Signature label="CHEF D’ÉTABLISSEMENT UNIVERSITAIRE" />
          <div style={stampStyle}>
          <img src={stamp.src} alt="Cachet de l'établissement" style={stampImageStyle} />
        </div>
          <Signature label={etablissement.titre_directeur || "DIRECTEUR DES AFFAIRES ACADÉMIQUES"} />
        </div>
        <div style={yearStyle}>Année académique : {parametres.annee_academique || "—"}</div>
      </footer>
    </Box>
  );
});

function InfoCell({ label, value, width }) { return <div style={{ ...infoCellStyle, width }}><b>{label} :</b><span>{value || ""}</span></div>; }
function Detail({ label, value }) { return <div style={detailRowStyle}><b>{label} :</b><span>{value || ""}</span></div>; }
function DetailBox({ title, value }) { return <div style={detailBoxStyle}><b>{title}</b><span>{value || ""}</span></div>; }
function Signature({ label }) { return <div style={signatureStyle}><b>{label}</b><i style={signatureLineStyle} /></div>; }

function SemesterTable({ semester }) {
  const notes = semester.notes || [];
  const rows = [...notes.slice(0, MAX_ROWS), ...Array(Math.max(0, MAX_ROWS - notes.length)).fill(null)];
  return <section style={semesterStyle}>
    <div style={semesterLabelStyle}>SEMESTRE / SESSION : <span>{semester.session}</span></div>
    <table style={tableStyle}>
      <thead><tr>{["Code du cours", "Titre du cours", "Statut", <>Valeur des<br />crédits</>, "Note", <>Crédits<br />obtenus</>, <>Crédits<br />pour GPA</>, <>Points<br />de grade</>, "Session"].map((title, index) => <th key={index} style={{ ...th, width: columnWidths[index] }}>{title}</th>)}</tr></thead>
      <tbody>{rows.map((note, index) => <tr key={note?.id || `empty-${index}`}><td style={td}>{note?.code_ue}</td><td style={{ ...td, textAlign: "left" }}>{note?.module_nom}</td><td style={td}>{note ? statusFromScore(note.note_finale) : ""}</td><td style={td}>{note?.credits}</td><td style={td}>{formatScore(note?.note_finale)}</td><td style={td}>{isPassed(note?.note_finale) ? note.credits : ""}</td><td style={td}>{note?.credits || ""}</td><td style={td}>{gradePoints(note?.note_finale)}</td><td style={td}>{note ? "NS" : ""}</td></tr>)}</tbody>
    </table>
    <div style={totalsStyle}><div style={totalCellStyle}>Total crédits tentés : <b>{semester.total_credits || ""}</b></div><div style={totalCellStyle}>Total crédits pour GPA : <b>{semester.total_credits || ""}</b></div><div style={totalCellStyle}>Total crédits obtenus : <b>{semester.credits_obtenus || ""}</b></div><div style={totalCellStyle}>Crédits pour GPA obtenus : <b>{semester.credits_obtenus || ""}</b></div><div style={{ ...totalCellStyle, gridColumn: "1 / -1" }}>Moyenne semestrielle (GPA) : <b>{gpa(semester.moyenne)}</b></div></div>
  </section>;
}

function formatScore(value) { return value == null || value === "" ? "" : Number(value).toFixed(2); }
function isPassed(value) { return value != null && Number(value) >= 50; }
function statusFromScore(value) { return value == null ? "" : isPassed(value) ? "Validé" : "Non validé"; }
function gradePoints(value) { if (value == null) return ""; const score = Number(value); if (score >= 80) return "4.0"; if (score >= 70) return "3.5"; if (score >= 60) return "3.0"; if (score >= 55) return "2.5"; if (score >= 50) return "2.0"; if (score >= 45) return "1.5"; if (score >= 40) return "1.0"; return "0.0"; }
function gpa(value) { return value == null || value === "" ? "" : (Number(value) / 20).toFixed(2); }

const pageStyle = { width: "210mm", height: "297mm", overflow: "hidden", boxSizing: "border-box", mx: "auto", p: "5mm", bgcolor: "#fff", color: NAVY, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "7pt", fontWeight: 600 };
const headerStyle = { height: "39mm", position: "relative", display: "flex", alignItems: "flex-start", borderBottom: `0.35mm solid ${NAVY}` };
const institutionLogoStyle = { width: "66mm", height: "27mm", display: "flex", justifyContent: "center", alignItems: "center", borderRight: "0.25mm solid #333" }; const logoStyle = { width: "62mm", height: "26mm", objectFit: "contain" }; const logoFallbackStyle = { color: ORANGE, fontSize: "18pt", fontWeight: 900 };
const institutionNameStyle = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2mm", paddingTop: "2mm", fontSize: "8.5pt", textAlign: "center" }; const rightSealStyle = { width: "36mm", height: "29mm", border: `1mm double ${NAVY}`, borderRadius: "50%", display: "grid", placeItems: "center", textAlign: "center", fontSize: "5.5pt", fontWeight: 900, margin: "0 3mm" };
const contactLineStyle = { position: "absolute", left: 0, right: 0, bottom: "2mm", display: "grid", gridTemplateColumns: "1.5fr .85fr 1fr", gap: "1mm", fontSize: "5.5pt", alignItems: "center" }; const ruleStyle = { height: "2.2mm", borderTop: `1mm solid ${NAVY}`, borderBottom: `0.7mm solid ${ORANGE}`, marginTop: "0.8mm" };
const noticeStyle = { width: "63mm", minHeight: "16mm", marginLeft: "auto", marginTop: "2mm", border: "0.3mm solid #777", display: "flex", flexDirection: "column", textAlign: "center", fontSize: "6.4pt" }; const noticeTitleStyle = { display: "block", background: NAVY, color: "#fff", padding: "1.8mm", fontSize: "7.5pt" }; const noticeTextStyle = { padding: "1.8mm", lineHeight: 1.45, fontStyle: "italic" };
const identityStyle = { mt: "2.5mm", display: "flex", flexWrap: "wrap", borderTop: "0.3mm solid #666", borderLeft: "0.3mm solid #666" }; const infoCellStyle = { boxSizing: "border-box", height: "10.5mm", padding: "1.4mm 3mm", borderRight: "0.3mm solid #666", borderBottom: "0.3mm solid #666", display: "flex", flexDirection: "column", gap: "1mm", fontSize: "6.3pt" };
const detailsStyle = { height: "42mm", display: "flex", border: "0.3mm solid #666", borderTop: 0 }; const academicDetailsStyle = { width: "32%", padding: "1.2mm 2mm" }; const detailRowStyle = { minHeight: "6.55mm", display: "flex", alignItems: "flex-start", gap: "1.2mm", lineHeight: 1.2 }; const detailBoxStyle = { width: "19.5%", borderLeft: "0.3mm solid #777", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2mm", padding: "1.5mm", fontSize: "5.6pt" }; const gradingStyle = { width: "14.3%", borderLeft: "0.3mm solid #777", padding: "1.5mm 2mm", lineHeight: 1.68, fontSize: "5.5pt" }; const keyStyle = { flex: 1, borderLeft: "0.3mm solid #777", padding: "1.5mm 2mm", lineHeight: 1.6, fontSize: "5.1pt" };
const semesterStyle = { mt: "1.8mm" }; const semesterLabelStyle = { height: "6.2mm", display: "flex", alignItems: "center", color: ORANGE, fontWeight: 900, fontSize: "8pt", border: "0.3mm solid #777", borderBottom: 0, paddingLeft: "1.5mm" }; const tableStyle = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", color: NAVY, fontSize: "5.5pt" }; const th = { border: "0.3mm solid #777", height: "8.3mm", padding: "0.6mm", textAlign: "center", fontSize: "5.8pt" }; const td = { border: "0.3mm solid #888", height: "3.7mm", padding: "0.3mm 1mm", textAlign: "center", fontWeight: 500 }; const columnWidths = ["13%", "30%", "7%", "8%", "6%", "8%", "8%", "7%", "7%"];
const totalsStyle = { display: "grid", gridTemplateColumns: "45% 55%", borderLeft: "0.3mm solid #777", fontSize: "6pt" }; const totalCellStyle = { minHeight: "4mm", boxSizing: "border-box", borderRight: "0.3mm solid #777", borderBottom: "0.3mm solid #777", padding: "0.8mm 1.5mm" };
const footerStyle = { mt: "3mm", position: "relative" }; const warningStyle = { paddingLeft: "3mm", fontSize: "6.2pt", lineHeight: 1.4 }; const signaturesStyle = { display: "grid", gridTemplateColumns: "1fr 34mm 1fr", alignItems: "end", gap: "16mm", mt: "1.5mm" }; const signatureStyle = { display: "flex", minHeight: "24mm", flexDirection: "column", justifyContent: "space-between", textAlign: "center", fontSize: "6.2pt" }; const signatureLineStyle = { display: "block", borderBottom: "0.3mm solid #59616d", margin: "0 5mm" }; const stampStyle = { width: "31mm", height: "31mm", display: "grid", placeItems: "center" }; const stampImageStyle = { width: "29mm", height: "29mm", objectFit: "contain" }; const yearStyle = { position: "absolute", right: 0, bottom: 0, fontSize: "4.5pt", color: "#777" };

export default ReleveNotesTemplate;
