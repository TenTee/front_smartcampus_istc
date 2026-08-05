"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import { docFaqs } from "./mockDocsData";

export default function DocFAQ() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ py: 8, backgroundColor: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6, maxWidth: 700, mx: "auto" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "#2563EB", mb: 1 }}>
            <HelpOutlineIcon fontSize="medium" />
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
              FOIRE AUX QUESTIONS
            </Typography>
          </Box>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 800, color: "#0F172A", mb: 2 }}>
            Questions fréquentes sur la documentation
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748B", fontSize: "1.05rem" }}>
            Trouvez rapidement des réponses aux interrogations relatives à l'accès et à la validité des documents officiels SmartCampus.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={9}>
            {docFaqs.map((faq, idx) => {
              const panelId = `panel-${idx}`;
              return (
                <Accordion
                  key={idx}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: "12px !important",
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": {
                      borderColor: "#2563EB",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: expanded === panelId ? "#2563EB" : "#64748B" }} />}
                    sx={{
                      px: 3,
                      py: 1,
                      backgroundColor: expanded === panelId ? "#EFF6FF" : "#FFFFFF",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: expanded === panelId ? "#1E40AF" : "#1E293B",
                        fontSize: "1rem",
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, pt: 1.5, backgroundColor: "#FFFFFF" }}>
                    <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Grid>

          {/* Support CTA Card */}
          <Grid item xs={12} md={9}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                mt: 3,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                color: "#FFFFFF",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Vous ne trouvez pas le document recherché ?
                </Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                  Notre équipe administrative et académique est à votre disposition pour vous délivrer les pièces nécessaires.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  href="https://wa.me/237692563086"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    backgroundColor: "#2563EB",
                    color: "white",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 2.5,
                    py: 1,
                    "&:hover": { backgroundColor: "#1D4ED8" },
                  }}
                >
                  Assistance WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  href="mailto:support@smartcampus.cm"
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 2.5,
                    py: 1,
                    "&:hover": { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  Envoyer un e-mail
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
