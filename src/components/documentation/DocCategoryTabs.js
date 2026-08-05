"use client";

import React from "react";
import { Box, Container, Button, Typography } from "@mui/material";
import AppsIcon from "@mui/icons-material/Apps";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import { docCategories } from "./mockDocsData";

export default function DocCategoryTabs({ selectedCategory, setSelectedCategory, docCounts }) {
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "MenuBook":
        return <MenuBookIcon fontSize="small" />;
      case "Gavel":
        return <GavelIcon fontSize="small" />;
      case "AccountBalance":
        return <AccountBalanceIcon fontSize="small" />;
      case "Assignment":
        return <AssignmentIcon fontSize="small" />;
      case "Build":
        return <BuildIcon fontSize="small" />;
      default:
        return <AppsIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", py: 2.5 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            overflowX: "auto",
            pb: 1,
            "::-webkit-scrollbar": { height: 6 },
            "::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: 3 },
          }}
        >
          {docCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = docCounts[cat.id] || 0;

            return (
              <Button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                variant={isSelected ? "contained" : "outlined"}
                disableElevation
                startIcon={getCategoryIcon(cat.icon)}
                sx={{
                  borderRadius: "12px",
                  px: 2.5,
                  py: 1,
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.92rem",
                  backgroundColor: isSelected ? "#2563EB" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  borderColor: isSelected ? "#2563EB" : "#E2E8F0",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: isSelected ? "#1D4ED8" : "#F1F5F9",
                    borderColor: isSelected ? "#1D4ED8" : "#CBD5E1",
                  },
                }}
              >
                {cat.label}
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.2,
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                    color: isSelected ? "#FFFFFF" : "#64748B",
                  }}
                >
                  {count}
                </Box>
              </Button>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
