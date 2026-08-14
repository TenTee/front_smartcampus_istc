"use client";
import React, { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import { getMediaUrl } from "@/services/api/client";

const ReleveNotesTemplate = forwardRef(function ReleveNotesTemplate({ data }, ref) {
  if (!data) return null;

  const { etablissement, etudiant, parametres, semestres, resume } = data;
  const primary = etablissement?.couleur_primaire || "#193A7F";
  const secondary = etablissement?.couleur_secondaire || "#2A52A1";
  const pcc = parametres?.pourcentage_cc ?? 30;
  const psn = parametres?.pourcentage_sn ?? 70;

  return (
    <Box
      ref={ref}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        mx: "auto",
        bgcolor: "#fff",
        fontFamily: "'Inter', sans-serif",
        fontSize: "10px",
        color: "#1a1a1a",
        position: "relative",
        overflow: "hidden",
        p: 0,
        pb: "40px",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: primary,
          color: "#fff",
          px: 3,
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {(etablissement?.logo_entete || etablissement?.logo) && (
            <img
              src={getMediaUrl(etablissement.logo_entete || etablissement.logo)}
              alt="Logo"
              style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 4, background: "#fff", padding: 2 }}
              crossOrigin="anonymous"
            />
          )}
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
              {etablissement?.nom || "INSTITUT"}
            </Typography>
            <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>
              Excellence - Formation - Développement
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
            RELEVÉ DE NOTES
          </Typography>
          <Box
            sx={{
              bgcolor: secondary,
              px: 2,
              py: 0.3,
              borderRadius: 1,
              mt: 0.5,
              display: "inline-block",
            }}
          >
            <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#fff" }}>
              ANNÉE ACADÉMIQUE {parametres?.annee_academique || ""}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "right", fontSize: "8px" }}>
          {etablissement?.adresse && (
            <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.9)" }}>
              {etablissement.adresse}{etablissement.ville ? `, ${etablissement.ville}` : ""}
            </Typography>
          )}
          {etablissement?.telephone && (
            <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.9)" }}>
              Tel: {etablissement.telephone}
            </Typography>
          )}
          {etablissement?.email && (
            <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.9)" }}>
              {etablissement.email}
            </Typography>
          )}
          {etablissement?.site_web && (
            <Typography sx={{ fontSize: "8px", color: "rgba(255,255,255,0.9)" }}>
              {etablissement.site_web}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Student Info Section */}
      <Box sx={{ display: "flex", mx: 3, mt: 1.5, mb: 1, gap: 2 }}>
        <Box sx={{ flex: 1, border: "1px solid #ddd", borderRadius: 1, p: 1.2 }}>
          <InfoRow label="ÉTUDIANT" value={etudiant?.nom || "-"} />
          <InfoRow label="MATRICULE" value={etudiant?.matricule || "-"} />
          <InfoRow label="DATE DE NAISSANCE" value={etudiant?.date_naissance || "-"} />
          <InfoRow label="FILIÈRE" value={etudiant?.filiere || "-"} />
          <InfoRow label="NIVEAU / ANNÉE" value={etudiant?.niveau || "-"} />
        </Box>

        <Box sx={{ flex: 1, border: "1px solid #ddd", borderRadius: 1, p: 1.2 }}>
          <InfoRow label="ANNÉE ACADÉMIQUE" value={parametres?.annee_academique || "-"} />
          <InfoRow label="GROUPE / CLASSE" value={etudiant?.classe || "-"} />
        </Box>

        <Box
          sx={{
            width: 80,
            height: 100,
            border: "2px solid #ddd",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {etudiant?.photo ? (
            <img
              src={getMediaUrl(etudiant.photo)}
              alt="Photo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous"
            />
          ) : (
            <Typography sx={{ fontSize: "8px", color: "#999", textAlign: "center" }}>
              PHOTO<br />ÉTUDIANT
            </Typography>
          )}
        </Box>
      </Box>

      {/* Notes Tables - Both Semesters */}
      {semestres && semestres.length > 0 ? (
        semestres.map((semestre) => (
          <Box key={semestre.session} sx={{ mx: 3, mt: 1.5 }}>
            {/* Semester Header */}
            <Box
              sx={{
                bgcolor: secondary,
                px: 2,
                py: 0.5,
                borderRadius: "4px 4px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                {semestre.session}
              </Typography>
              <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>
                Moyenne: {semestre.moyenne != null ? `${semestre.moyenne} / 100` : "-"} | Crédits validés: {semestre.credits_valides}/{semestre.total_credits}
              </Typography>
            </Box>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle(primary)} rowSpan={2}>CODE UE</th>
                  <th style={thStyle(primary)} rowSpan={2}>INTITULÉ DES UNITÉS D&apos;ENSEIGNEMENT</th>
                  <th style={thStyle(primary)} rowSpan={2}>CRÉDITS</th>
                  <th style={thStyle(primary)} colSpan={3}>DÉTAIL DES NOTES</th>
                  <th style={thStyle(primary)} rowSpan={2}>GRADE</th>
                  <th style={thStyle(primary)} rowSpan={2}>OBSERVATIONS</th>
                </tr>
                <tr>
                  <th style={thSubStyle(secondary)}>CC ({pcc}%)</th>
                  <th style={thSubStyle(secondary)}>EXAM ({psn}%)</th>
                  <th style={thSubStyle(secondary)}>MOYENNE</th>
                </tr>
              </thead>
              <tbody>
                {semestre.notes && semestre.notes.length > 0 ? (
                  semestre.notes.map((note, idx) => (
                    <tr key={note.id || idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                      <td style={tdStyle}>{note.code_ue || "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "left", paddingLeft: 8 }}>{note.module_nom || "-"}</td>
                      <td style={tdStyle}>{note.credits || "-"}</td>
                      <td style={tdStyle}>{note.note_cc != null ? note.note_cc.toFixed(2) : "......"}</td>
                      <td style={tdStyle}>{note.note_sn != null ? note.note_sn.toFixed(2) : "......"}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {note.note_finale != null ? note.note_finale.toFixed(2) : "......"}
                      </td>
                      <td style={tdStyle}>{note.grade || "-"}</td>
                      <td style={{ ...tdStyle, fontSize: "8px" }}>{note.observation || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: 12 }}>
                      Aucune note enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        ))
      ) : (
        <Box sx={{ mx: 3, mt: 3, textAlign: "center", py: 4 }}>
          <Typography sx={{ fontSize: "12px", color: "#999" }}>
            Aucune note enregistrée pour cette année académique
          </Typography>
        </Box>
      )}

      {/* Global Summary Section */}
      <Box
        sx={{
          mx: 3,
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <SummaryCard
          icon="📊"
          label="MOYENNE ANNUELLE"
          value={resume?.moyenne_annuelle != null ? `${resume.moyenne_annuelle} / 100` : "- / 100"}
          color={primary}
        />
        <SummaryCard
          icon="🎓"
          label="CRÉDITS OBTENUS"
          value={`${resume?.credits_obtenus || 0} / ${resume?.total_credits || 0}`}
          color={primary}
        />
        <SummaryCard
          icon="✅"
          label="CRÉDITS VALIDÉS"
          value={`${resume?.credits_valides || 0} / ${resume?.total_credits || 0}`}
          color={primary}
        />
        <SummaryCard
          icon="📈"
          label="RANG / EFFECTIF"
          value={`${resume?.rang || "-"} / ${resume?.effectif || "-"}`}
          color={primary}
        />
        <SummaryCard
          icon="🏆"
          label="MENTION"
          value={resume?.mention || "-"}
          color={primary}
        />
      </Box>

      {/* Décision du jury */}
      <Box sx={{ mx: 3, mt: 2 }}>
        <Typography sx={{ fontSize: "10px", fontWeight: 700 }}>
          DÉCISION DU JURY : .........................................................................................................
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          DATE : _____ / _____ / 20____
        </Typography>
      </Box>

      {/* Signatures */}
      <Box
        sx={{
          mx: 3,
          mt: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography sx={{ fontSize: "9px", fontWeight: 700, mb: 4 }}>
            LE PRÉSIDENT DU JURY
          </Typography>
          <Box sx={{ borderTop: "1px solid #333", width: 120, mx: "auto", pt: 0.5 }}>
            <Typography sx={{ fontSize: "8px" }}>Nom et Signature</Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", flex: 1 }}>
          {(etablissement?.logo_entete || etablissement?.logo) && (
            <img
              src={getMediaUrl(etablissement.logo_entete || etablissement.logo)}
              alt="Sceau"
              style={{ height: 40, opacity: 0.3, margin: "0 auto 4px", display: "block" }}
              crossOrigin="anonymous"
            />
          )}
          <Typography sx={{ fontSize: "9px", fontWeight: 700, mb: 4 }}>
            LE RESPONSABLE PÉDAGOGIQUE
          </Typography>
          <Box sx={{ borderTop: "1px solid #333", width: 120, mx: "auto", pt: 0.5 }}>
            <Typography sx={{ fontSize: "8px" }}>Nom et Signature</Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography sx={{ fontSize: "9px", fontWeight: 700, mb: 4 }}>
            {etablissement?.titre_directeur || "LE DIRECTEUR"}
          </Typography>
          {etablissement?.signature_directeur && (
            <img
              src={getMediaUrl(etablissement.signature_directeur)}
              alt="Signature"
              style={{ height: 30, margin: "0 auto 4px", display: "block" }}
              crossOrigin="anonymous"
            />
          )}
          <Box sx={{ borderTop: "1px solid #333", width: 120, mx: "auto", pt: 0.5 }}>
            <Typography sx={{ fontSize: "8px" }}>
              {etablissement?.nom_directeur || "Nom et Signature"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer / Slogan - fixed at bottom of page */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: primary,
          py: 1,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#FFD700", fontStyle: "italic" }}>
          {etablissement?.slogan || "Former aujourd'hui, construire demain."}
        </Typography>
      </Box>
    </Box>
  );
});

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", mb: 0.4 }}>
      <Typography sx={{ fontSize: "9px", fontWeight: 700, minWidth: 130 }}>
        {label} :
      </Typography>
      <Typography sx={{ fontSize: "9px", flex: 1, borderBottom: "1px dotted #999" }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        border: `1px solid ${color}`,
        borderRadius: 1,
        px: 1.5,
        py: 1,
        minWidth: 100,
        flex: 1,
      }}
    >
      <Typography sx={{ fontSize: "14px", mb: 0.3 }}>{icon}</Typography>
      <Typography sx={{ fontSize: "7px", fontWeight: 700, color, textTransform: "uppercase", mb: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "11px", fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}

const thStyle = (bg) => ({
  background: bg,
  color: "#fff",
  padding: "5px 4px",
  fontSize: "8px",
  fontWeight: 700,
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.3)",
  textTransform: "uppercase",
});

const thSubStyle = (bg) => ({
  background: bg,
  color: "#fff",
  padding: "3px 3px",
  fontSize: "7.5px",
  fontWeight: 600,
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.3)",
});

const tdStyle = {
  padding: "4px 4px",
  textAlign: "center",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "9px",
};

export default ReleveNotesTemplate;
