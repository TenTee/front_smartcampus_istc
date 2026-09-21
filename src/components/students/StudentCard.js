"use client";

import React, { useState } from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatDate } from "../../utils/formatters";

// Helper simple pour générer un code-barres visuel au format SVG pour le matricule
function BarcodeSVG({ value = "STD-2025-0001", width = 180, height = 36 }) {
  const pattern = Array.from(value).map((char) => {
    const code = char.charCodeAt(0);
    return {
      w1: (code % 3) + 1,
      w2: ((code * 2) % 3) + 1,
      w3: ((code * 3) % 2) + 1,
    };
  });

  let x = 10;
  const bars = [];
  pattern.forEach((p, idx) => {
    bars.push(<rect key={`b1-${idx}`} x={x} y={4} width={p.w1} height={24} fill="#111" />);
    x += p.w1 + 1.5;
    bars.push(<rect key={`b2-${idx}`} x={x} y={4} width={p.w2} height={24} fill="#111" />);
    x += p.w2 + 1;
    bars.push(<rect key={`b3-${idx}`} x={x} y={4} width={p.w3} height={24} fill="#111" />);
    x += p.w3 + 1.5;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={width} height={height} viewBox={`0 0 ${x + 10} ${height}`}>
        <rect width="100%" height="100%" fill="#ffffff" rx={2} />
        {bars}
      </svg>
      <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: 1.5, mt: -0.3, color: "#333", fontWeight: "bold" }}>
        {value}
      </Typography>
    </Box>
  );
}

// Composant QR Code SVG léger et déterministe
function QRCodeSVG({ value = "", size = 64 }) {
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const gridSize = 21;
  const cellSize = size / gridSize;
  const seed = hashString(value || "SMART-CAMPUS-STUDENT");
  const matrix = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));

  const addFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, gridSize - 7);
  addFinder(gridSize - 7, 0);

  let currentSeed = seed;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isFinderZone =
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8);
      if (!isFinderZone) {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        matrix[r][c] = (currentSeed / 233280) > 0.45;
      }
    }
  }

  const rects = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (matrix[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#111827"
          />
        );
      }
    }
  }

  return (
    <Box sx={{ p: 0.5, bgcolor: "white", borderRadius: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width="100%" height="100%" fill="#ffffff" />
        {rects}
      </svg>
    </Box>
  );
}

// Face RECTO (Front) 2D pure
function FrontFaceContent({ studentData, configProps, width, height }) {
  const {
    schoolName,
    logoUrl,
    primaryColor,
    secondaryColor,
    photoUrl,
    filiereNom,
    niveauNom,
    classeNom,
    anneeAcademique,
    matricule,
    nomEtudiant,
    dateNaissance,
    schoolVille,
  } = studentData;

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "14px",
        overflow: "hidden",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Filigrane d'arrière-plan */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
          pointerEvents: "none",
        }}
      />

      {/* En-tête officiel */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          color: "#ffffff",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #E2E8F0",
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "white",
              p: 0.3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: 0.5,
                lineHeight: 1.1,
                textTransform: "uppercase",
                color: "#FFFFFF",
              }}
            >
              {schoolName}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.6rem",
                letterSpacing: 1.2,
                opacity: 0.9,
                fontWeight: 600,
                color: "#93C5FD",
                textTransform: "uppercase",
              }}
            >
              Carte d&apos;Étudiant Officielle
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "rgba(255, 255, 255, 0.15)",
            px: 1,
            py: 0.3,
            borderRadius: "10px",
            backdropFilter: "blur(4px)",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 13, color: "#10B981" }} />
          <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: "#ffffff", letterSpacing: 0.5 }}>
            RÉGULIER
          </Typography>
        </Box>
      </Box>

      {/* Corps du Recto */}
      <Box sx={{ flex: 1, p: 1.8, display: "flex", gap: 2, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 95,
              height: 118,
              borderRadius: "8px",
              border: `2px solid ${primaryColor}`,
              boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
              overflow: "hidden",
              bgcolor: "#F1F5F9",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={nomEtudiant}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <BadgeIcon sx={{ fontSize: 56, color: "#94A3B8" }} />
            )}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: "rgba(15, 23, 42, 0.82)",
                color: "white",
                py: 0.2,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: 0.5 }}>
                {anneeAcademique}
              </Typography>
            </Box>
          </Box>

          {/* Simulation Puce Smart Card */}
          <Box
            sx={{
              width: 36,
              height: 27,
              borderRadius: "5px",
              background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
              border: "1px solid #d4af37",
              position: "relative",
              boxShadow: "inset 0 0 2px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", top: "33%", left: 0, right: 0, height: "1px", bgcolor: "rgba(0,0,0,0.25)" }} />
            <Box sx={{ position: "absolute", top: "66%", left: 0, right: 0, height: "1px", bgcolor: "rgba(0,0,0,0.25)" }} />
            <Box sx={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "1px", bgcolor: "rgba(0,0,0,0.25)" }} />
          </Box>
        </Box>

        {/* Détails Étudiant */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
            <Box>
              <Typography sx={{ fontSize: "0.58rem", textTransform: "uppercase", color: "#64748B", fontWeight: 600, letterSpacing: 0.5 }}>
                Nom & Prénom
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.92rem",
                  fontWeight: 800,
                  color: "#0F172A",
                  lineHeight: 1.15,
                  textTransform: "uppercase",
                }}
              >
                {nomEtudiant}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.2 }}>
              <Box
                sx={{
                  bgcolor: `${primaryColor}12`,
                  border: `1px solid ${primaryColor}40`,
                  px: 1,
                  py: 0.2,
                  borderRadius: "6px",
                }}
              >
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: primaryColor, fontFamily: "monospace" }}>
                  MAT: {matricule}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 0.4 }}>
              <Typography sx={{ fontSize: "0.55rem", textTransform: "uppercase", color: "#64748B", fontWeight: 600 }}>
                Filière / Spécialité
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#1E293B", lineHeight: 1.2 }}>
                {filiereNom}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: "0.55rem", textTransform: "uppercase", color: "#64748B", fontWeight: 600 }}>
                  Niveau / Classe
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>
                  {niveauNom} {classeNom ? `(${classeNom})` : ""}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.55rem", textTransform: "uppercase", color: "#64748B", fontWeight: 600 }}>
                  Né(e) le
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>
                  {dateNaissance}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              pt: 0.5,
              borderTop: "1px stroke #E2E8F0",
            }}
          >
            <Typography sx={{ fontSize: "0.58rem", color: "#64748B", fontStyle: "italic" }}>
              Valable pour l&apos;année universitaire {anneeAcademique}
            </Typography>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: primaryColor, letterSpacing: 0.5 }}>
              {schoolVille.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: 6, background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} />
    </Box>
  );
}

// Face VERSO (Back) 2D pure
function BackFaceContent({ studentData, configProps, width, height }) {
  const {
    schoolName,
    primaryColor,
    directeurTitre,
    directeurNom,
    signatureUrl,
    schoolVille,
    schoolTel,
    schoolEmail,
    schoolAdresse,
    matricule,
    nomEtudiant,
    anneeAcademique,
  } = studentData;

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "14px",
        overflow: "hidden",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
        boxSizing: "border-box",
      }}
    >
      {/* Piste magnétique */}
      <Box
        sx={{
          width: "100%",
          height: 38,
          bgcolor: "#1E293B",
          mt: 1.5,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", bgcolor: "rgba(255,255,255,0.1)" }} />
      </Box>

      {/* Corps du Verso */}
      <Box sx={{ flex: 1, p: 1.5, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <QRCodeSVG value={`STUDENT:${matricule}|NOM:${nomEtudiant}|YEAR:${anneeAcademique}`} size={68} />
            <Typography sx={{ fontSize: "0.52rem", color: "#64748B", fontWeight: 700, mt: 0.3 }}>
              SCAN & VERIFY
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: primaryColor, mb: 0.3, textTransform: "uppercase" }}>
              Notice & Propriété
            </Typography>
            <Typography sx={{ fontSize: "0.55rem", color: "#475569", lineHeight: 1.25, mb: 0.8 }}>
              Cette carte est strictement personnelle et incessible. Elle reste la propriété exclusive de l&apos;établissement{" "}
              <strong>{schoolName}</strong>. Toute personne la trouvant est priée de la retourner à l&apos;adresse ci-dessous.
            </Typography>

            <Box sx={{ bgcolor: "#F1F5F9", p: 0.6, borderRadius: "6px", border: "1px solid #E2E8F0" }}>
              <Typography sx={{ fontSize: "0.54rem", color: "#334155", fontWeight: 600 }}>
                📍 {schoolAdresse} - {schoolVille}
              </Typography>
              <Typography sx={{ fontSize: "0.54rem", color: "#334155", fontWeight: 600 }}>
                📞 {schoolTel} | ✉️ {schoolEmail}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 0.5, borderTop: "1px dashed #CBD5E1" }}>
          <BarcodeSVG value={matricule} width={175} height={32} />

          <Box sx={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Typography sx={{ fontSize: "0.54rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              {directeurTitre}
            </Typography>

            <Box
              sx={{
                height: 28,
                minWidth: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                my: 0.2,
              }}
            >
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              ) : (
                <Typography sx={{ fontFamily: "cursive", fontSize: "0.7rem", color: primaryColor, fontStyle: "italic" }}>
                  {directeurNom || "Le Directeur"}
                </Typography>
              )}
            </Box>

            <Typography sx={{ fontSize: "0.52rem", fontWeight: 800, color: "#1E293B" }}>
              {directeurNom}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: 5, bgcolor: primaryColor }} />
    </Box>
  );
}

export default function StudentCard({
  student,
  config = {},
  side = "front",
  flipable = true,
  scale = 1,
  id = "student-card-preview",
}) {
  const [isFlipped, setIsFlipped] = useState(side === "back");

  const latestInscription = student?.inscriptions?.[0] || {};

  const studentData = {
    schoolName: config?.nom || "IFPT SMART CAMPUS",
    logoUrl: config?.logo_entete || config?.logo || "/LOGO SMART CAMPUS.svg",
    primaryColor: config?.couleur_primaire || "#193A7F",
    secondaryColor: config?.couleur_secondaire || "#0D1B2A",
    directeurTitre: config?.titre_directeur || "Le Directeur Général",
    directeurNom: config?.nom_directeur || "",
    signatureUrl: config?.signature_directeur,
    schoolVille: config?.ville || "Douala",
    schoolTel: config?.telephone || "(+237) 6xx xxx xxx",
    schoolEmail: config?.email || "contact@smartcampus.com",
    schoolAdresse: config?.adresse || "Campus Principal",

    photoUrl:
      student?.photo ||
      (student?.documents && Array.isArray(student.documents)
        ? student.documents.find((d) => d?.type_document?.toLowerCase()?.includes("photo"))?.fichier
        : null),

    filiereNom:
      student?.filiere_nom ||
      student?.filiere_details?.nom ||
      (typeof student?.filiere === "object" ? student?.filiere?.nom : student?.filiere) ||
      latestInscription?.filiere_nom ||
      "Formation Supérieure",

    niveauNom:
      latestInscription?.niveau_nom ||
      latestInscription?.niveau?.nom ||
      student?.niveau ||
      "En cours",

    classeNom:
      latestInscription?.classe_nom ||
      latestInscription?.classe?.nom ||
      student?.classe ||
      "",

    anneeAcademique:
      latestInscription?.annee_academique ||
      student?.annee_academique ||
      "2025/2026",

    matricule: student?.matricule || "STD-2025-XXXX",
    nomEtudiant: (student?.nom || "Nom & Prénom").toUpperCase(),
    dateNaissance: student?.date_naissance ? formatDate(student.date_naissance) : "—",
  };

  const width = Math.round(450 * scale);
  const height = Math.round(284 * scale);

  const handleFlip = (e) => {
    e?.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
      {/* Conteneur de prévisualisation à l'écran */}
      <Box
        id={id}
        sx={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: "14px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {isFlipped ? (
          <BackFaceContent studentData={studentData} configProps={config} width={width} height={height} />
        ) : (
          <FrontFaceContent studentData={studentData} configProps={config} width={width} height={height} />
        )}
      </Box>

      {/* Conteneurs 2D Hors-champ dédiés à la capture html2canvas (Garantie 0 chevauchement) */}
      <Box
        id={`${id}-front-export`}
        sx={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: `${width}px`,
          height: `${height}px`,
          bgcolor: "white",
          zIndex: -9999,
        }}
      >
        <FrontFaceContent studentData={studentData} configProps={config} width={width} height={height} />
      </Box>

      <Box
        id={`${id}-back-export`}
        sx={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: `${width}px`,
          height: `${height}px`,
          bgcolor: "white",
          zIndex: -9999,
        }}
      >
        <BackFaceContent studentData={studentData} configProps={config} width={width} height={height} />
      </Box>

      {/* Bouton de retournement */}
      {flipable && (
        <Tooltip title="Basculer entre le Recto et le Verso de la carte">
          <Button
            variant="outlined"
            size="small"
            onClick={handleFlip}
            startIcon={<FlipCameraAndroidIcon />}
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              py: 0.5,
              borderColor: studentData.primaryColor,
              color: studentData.primaryColor,
              "&:hover": {
                borderColor: studentData.primaryColor,
                bgcolor: `${studentData.primaryColor}10`,
              },
            }}
          >
            {isFlipped ? "Voir le Recto" : "Voir le Verso"}
          </Button>
        </Tooltip>
      )}
    </Box>
  );
}
