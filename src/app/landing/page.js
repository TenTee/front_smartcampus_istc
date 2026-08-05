"use client";

import React from "react";
import { Box } from "@mui/material";
import LandingHeader from "@/components/landing/LandingHeader";
import HomeHero from "@/components/landing/HomeHero";
import ImpactStats from "@/components/landing/ImpactStats";
import Features from "@/components/landing/Features";
import RoleBenefits from "@/components/landing/RoleBenefits";
import Benefits from "@/components/landing/Benefits";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <LandingHeader />
      <HomeHero />
  
      <Features />
      <RoleBenefits />
      <Benefits />
      <HowItWorks />
      <CTA />
      <Footer />
    </Box>
  );
}
