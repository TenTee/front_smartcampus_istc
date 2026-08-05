"use client";

import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function LandingHeader() {
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        py: 2.5,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      width: '60%'
                    }}
                  >
                    <img 
                      src="/LOGO SMART CAMPUS.svg" 
                      alt="Smart Campus Logo" 
                      style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                  </Box>
                </Box>

          {/* CTA WhatsApp */}
          <Button
            variant="contained"
            disableElevation
            startIcon={<WhatsAppIcon />}
            href="https://wa.me/237692563086"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: "#2563EB", 
              color: "white",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: "8px",
              px: { xs: 2, sm: 3 },
              py: 1,
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "block" } }}>
              Nous contacter
            </Box>
            <Box component="span" sx={{ display: { xs: "block", sm: "none" } }}>
              Contact
            </Box>
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
