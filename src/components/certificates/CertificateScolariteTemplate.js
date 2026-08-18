"use client";

import React, { forwardRef } from "react";
import logo2 from "../../../public/logoistc2.png";

const NAVY = "#07358f";
const ORANGE = "#dc8739";

const CertificateScolariteTemplate = forwardRef(function CertificateScolariteTemplate({ student = {}, school = {}, inscription = {} }, ref) {
  const issueDate = new Date();
  const academicYear = inscription.annee_academique || inscription.annee_academique_ref_libelle || "—";
  const level = inscription.niveau_nom || inscription.niveau?.nom || "—";
  const course = school.filiere || "—";
  const city = school.ville || "Yaoundé";

  return <article ref={ref} id="printable-certificate" style={pageStyle}>
    <div style={watermarkStyle} aria-hidden="true" />
    <header style={headerStyle}>
      <img src={logo2.src} alt="Logo ISTC" style={logoStyle} />
      <div style={schoolTitleStyle}>
        <strong>Institut Supérieur de<br />Technologie et de<br />Commerce</strong>
        <b>Agrément N° : 22-01965/L/MINESUP/SG/DDES/ESUP/SDA/AOSB</b>
      </div>
      <div style={contactsStyle}>
        <div>☎ {school.telephone || "+237 695228007 / +237 675844876"}</div>
        <div>✉ {school.email || "contact@isare-istc.education"}</div>
        <div>● {school.adresse || "Awae-escalier, Yaoundé"}</div>
      </div>
    </header>

    <div style={orangeLineStyle} />
    <h1 style={titleStyle}>CERTIFICAT DE SCOLARITÉ</h1>

    <main style={bodyStyle}>
      <p>Je soussigné(e), <strong>{school.directeurNom || "Le Chef d’Établissement"}</strong>, agissant en qualité de Chef d’établissement au sein de l’Institut Supérieur de Technologie et de Commerce (ISTC),</p>
      <p style={certifyStyle}>CERTIFIE PAR LA PRÉSENTE QUE :</p>
      <div style={studentBlockStyle}>
        <div>L’étudiant(e) : <strong>{student.nom || "—"}</strong></div>
        <div>Né(e) le : <strong>{formatDate(student.date_naissance)}</strong></div>
        {student.nationalite && <div>De nationalité : <strong>{student.nationalite}</strong></div>}
        <div>De numéro matricule : <strong>{student.matricule || "—"}</strong></div>
        {student.contact && <div>Demeurant à : <strong>{student.contact}</strong></div>}
      </div>
      <p><strong>Est régulièrement inscrit(e) au sein de notre établissement pour l’année académique {academicYear} en :</strong></p>
      <ul style={listStyle}>
        <li>Filière : <strong>{course}</strong></li>
        <li>Niveau d’étude : <strong>{level}</strong></li>
        <li>Régime : <strong>Cours du Jour</strong></li>
      </ul>
      <p><strong>Le présent certificat est délivré à l’intéressé(e) pour servir et valoir ce que de droit, notamment pour ses démarches administratives, sociales ou d’obtention de stage.</strong></p>
      <p><strong>En foi de quoi, ce document est établi et signé pour attester de sa qualité d’étudiant(e) à l’ISTC, institution sous tutelle académique de l’Université de Bamenda.</strong></p>
      <p style={placeDateStyle}>Fait à <span>{city.toUpperCase()}</span>, le <span>{issueDate.toLocaleDateString("fr-FR")}</span><br />(Validité : Année Académique en cours)</p>
      <div style={signatureStyle}>LE CHEF D’ÉTABLISSEMENT<i /></div>
    </main>
    <div style={footerBarStyle} />
  </article>;
});

function formatDate(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR"); }

const pageStyle = { width: "210mm", height: "297mm", position: "relative", overflow: "hidden", boxSizing: "border-box", padding: "5mm 11mm 0", background: "#fff", color: "#050505", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10pt", lineHeight: 1.42 };
const watermarkStyle = { position: "absolute", zIndex: 0, width: "145mm", height: "145mm", left: "32mm", top: "38mm", borderRadius: "50%", border: "10mm solid rgba(176, 202, 223, .27)", boxShadow: "0 0 0 22mm rgba(226, 177, 128, .11), 0 0 0 45mm rgba(182, 201, 220, .12)", transform: "rotate(-17deg)" };
const headerStyle = { position: "relative", zIndex: 1, height: "29mm", display: "flex", alignItems: "flex-start" }; const logoStyle = { width: "34mm", height: "27mm", objectFit: "contain" }; const schoolTitleStyle = { flex: 1, color: NAVY, display: "flex", flexDirection: "column", fontSize: "16.5pt", lineHeight: .97, fontWeight: 900 }; const contactsStyle = { minWidth: "57mm", paddingTop: "1mm", fontSize: "7.6pt", lineHeight: 1.55, textAlign: "left" }; const orangeLineStyle = { position: "relative", zIndex: 1, width: "94mm", marginLeft: "92mm", borderTop: `0.6mm solid ${ORANGE}` };
const titleStyle = { position: "relative", zIndex: 1, margin: "16mm 0 18mm", textAlign: "center", fontSize: "17pt", letterSpacing: ".02em" }; const bodyStyle = { position: "relative", zIndex: 1, fontSize: "10.1pt", letterSpacing: ".025em" }; const certifyStyle = { marginTop: "13mm", marginBottom: "9mm" }; const studentBlockStyle = { marginBottom: "8mm", lineHeight: 1.5 }; const listStyle = { margin: "-2mm 0 7mm", paddingLeft: "8mm", lineHeight: 1.35 }; const placeDateStyle = { marginTop: "12mm", fontWeight: 700 }; const signatureStyle = { width: "57mm", marginLeft: "auto", marginTop: "18mm", textAlign: "center", fontSize: "9pt", fontWeight: 800, textDecoration: "underline", display: "flex", flexDirection: "column", gap: "21mm" }; const footerBarStyle = { position: "absolute", height: "13mm", bottom: 0, left: 0, right: 0, background: ORANGE, clipPath: "polygon(0 0, 24% 0, 34% 100%, 0 100%)" };

export default CertificateScolariteTemplate;
