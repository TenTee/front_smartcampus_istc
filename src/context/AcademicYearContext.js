'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { anneesAcademiquesService } from '../services/api/services';

const AcademicYearContext = createContext();

export const AcademicYearProvider = ({ children }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearError, setYearError] = useState(null);

  const fetchYears = async () => {
    try {
      const years = await anneesAcademiquesService.list();
      const list = Array.isArray(years) ? years : years?.results || [];
      setAcademicYears(list);

      const permissions = (() => {
        try {
          return JSON.parse(localStorage.getItem('user_permissions') || '{}');
        } catch {
          return {};
        }
      })();
      const allowInactive = !!permissions.is_superuser;

      // Récupérer l'année stockée ou utiliser l'année active par défaut
      const storedYearId = localStorage.getItem('selectedAcademicYearId');
      const active = list.find(y => y.est_active) || list[0];
      if (storedYearId) {
        const found = list.find(y => String(y.id) === String(storedYearId));
        if (found && (found.est_active || allowInactive)) {
          setSelectedYear(found);
        } else {
          localStorage.removeItem('selectedAcademicYearId');
          setSelectedYear(active);
          if (found && !allowInactive) {
            setYearError("L'année sélectionnée est archivée et ne peut être utilisée que par le super-admin.");
          }
        }
      } else {
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
      setYearError(null);
    }
  }, [selectedYear]);

  const changeYear = (yearId) => {
    const year = academicYears.find(y => String(y.id) === String(yearId));
    if (!year) return;

    const permissions = (() => {
      try {
        return JSON.parse(localStorage.getItem('user_permissions') || '{}');
      } catch {
        return {};
      }
    })();
    const allowInactive = !!permissions.is_superuser;

    if (!year.est_active && !allowInactive) {
      setYearError("L'année sélectionnée est archivée et ne peut être utilisée que par le super-admin.");
      return false;
    }

    setYearError(null);
    // L'intercepteur API lit cette valeur pour envoyer X-Academic-Year.
    // On l'enregistre avant le rendu suivant, afin que les requêtes de la
    // page courante utilisent immédiatement la nouvelle année.
    localStorage.setItem('selectedAcademicYearId', year.id);
    localStorage.setItem('selectedAcademicYearLibelle', year.libelle);
    setSelectedYear(year);
    window.dispatchEvent(new CustomEvent('academicYearChanged', { detail: { yearId: year.id } }));
    return true;
  };

  return (
    <AcademicYearContext.Provider value={{ 
      academicYears, 
      selectedYear, 
      changeYear, 
      loading,
      refreshYears: fetchYears,
      yearError,
      clearYearError: () => setYearError(null),
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
