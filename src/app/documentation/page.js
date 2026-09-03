"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useSearchParams } from "next/navigation";
import DocHero from "@/components/documentation/DocHero";
import DocCategoryTabs from "@/components/documentation/DocCategoryTabs";
import DocCardGrid from "@/components/documentation/DocCardGrid";
import DocFAQ from "@/components/documentation/DocFAQ";
import { mockDocuments } from "@/components/documentation/mockDocsData";

function DocumentationContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Compute count of docs per category
  const docCounts = useMemo(() => {
    const counts = { all: mockDocuments.length };
    mockDocuments.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered documents based on category and search query
  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesCategory =
        selectedCategory === "all" || doc.category === selectedCategory;

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.categoryLabel.toLowerCase().includes(query) ||
        doc.targetAudience.toLowerCase().includes(query) ||
        doc.summary.some((s) => s.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Hero Header with Search Bar */}
      <DocHero
        searchSearchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        totalDocsCount={mockDocuments.length}
      />

      {/* Category Tabs / Filters */}
      <DocCategoryTabs
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        docCounts={docCounts}
      />

      {/* Document Grid with Cards and Modal */}
      <DocCardGrid
        documents={filteredDocuments}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
      />

      {/* FAQ & Support Section */}
      <DocFAQ />
    </Box>
  );
}

export default function DocumentationPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>}>
      <DocumentationContent />
    </Suspense>
  );
}
