"use client";

import React from "react";
import { Box, Container, Typography, Grid, Link, Divider } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export default function Footer() {
  return (
    <Box
      sx={{
        backgroundColor: "#193A7F",
        color: "white",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Box 
                     sx={{ 
                       backgroundColor: 'white', 
                       borderRadius: 1, 
                       p: 1, 
                       my: 2,
                       display: 'flex', 
                       alignItems: 'end', 
                       justifyContent: 'end', 
                       width: '50%'
                     }}
                   >
                     <img 
                       src="/LOGO SMART CAMPUS.svg" 
                       alt="Smart Campus Logo" 
                       style={{ maxWidth: '100%', height: 'auto' }} 
                     />
                   </Box>
                 </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              La solution de gestion scolaire pensée pour les établissements
              camerounais.
            </Typography>
            {/* <Box sx={{ display: "flex", gap: 1 }}>
              <FacebookIcon sx={{ cursor: "pointer", fontSize: "1.5rem" }} />
              <TwitterIcon sx={{ cursor: "pointer", fontSize: "1.5rem" }} />
              <LinkedInIcon sx={{ cursor: "pointer", fontSize: "1.5rem" }} />
            </Box> */}
          </Grid>


        </Grid>

        <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", my: 3 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2026 Smart Campus. Tous droits réservés.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Fait avec ❤️ pour l'éducation au Cameroun
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
