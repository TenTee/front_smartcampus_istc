'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { anneesAcademiquesService } from '../services/api/services';

const AcademicYearContext = createContext();

export const AcademicYearProvider = ({ children }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchYears = async () => {
    try {
      const years = await anneesAcademiquesService.list();
      const list = Array.isArray(years) ? years : years?.results || [];
      setAcademicYears(list);
      
      // Récupérer l'année stockée ou utiliser l'année active par défaut
      const storedYearId = localStorage.getItem('selectedAcademicYearId');
      if (storedYearId) {
        const found = list.find(y => String(y.id) === String(storedYearId));
        if (found) {
          setSelectedYear(found);
        } else {
          const active = list.find(y => y.est_active) || list[0];
          setSelectedYear(active);
        }
      } else {
        const active = list.find(y => y.est_active) || list[0];
        setSelectedYear(active);
      }
    } catch (error) {
      console.error("Erreur chargement années académiques:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      localStorage.setItem('selectedAcademicYearId', selectedYear.id);
      localStorage.setItem('selectedAcademicYearLibelle', selectedYear.libelle);
      // Optionnel: Déclencher un événement global pour notifier les composants
      window.dispatchEvent(new Event('academicYearChanged'));
    }
  }, [selectedYear]);

  const changeYear = (yearId) => {
    const year = academicYears.find(y => String(y.id) === String(yearId));
    if (year) setSelectedYear(year);
  };

  return (
    <AcademicYearContext.Provider value={{ 
      academicYears, 
      selectedYear, 
      changeYear, 
      loading,
      refreshYears: fetchYears 
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
