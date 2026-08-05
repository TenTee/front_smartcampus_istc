/**
 * Utilitaires pour le formatage des données, notamment les dates en français.
 */

/**
 * Formate une date en français (ex: "15 avril 2026")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} La date formatée ou '-' si non valide
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Formate une date et heure en français (ex: "15 avr. 2026 à 14:30")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} La date formatée ou '-' si non valide
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);

  const formattedTime = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return `${formattedDate} à ${formattedTime}`;
}
