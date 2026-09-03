import { useState, useEffect } from 'react';

export function isSuperUserOrAdmin(permissionsObj) {
  if (typeof window === 'undefined') return false;
  if (permissionsObj && permissionsObj.is_superuser) return true;
  const role = (localStorage.getItem('user_role') || '').toLowerCase().trim();
  return ['admin', 'superadmin', 'administrateur', 'adm', 'super admin', 'super-admin'].includes(role);
}

export function normalizePermissionValue(value) {
  if (value === true) return 'ecriture';
  if (value === false || value === null || value === undefined) return 'none';
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (['lecture', 'ecriture'].includes(normalized)) return normalized;
    if (normalized === 'true') return 'ecriture';
    if (normalized === 'false') return 'none';
  }
  return 'none';
}

export function hasReadAccess(permission, permissionsObj = null) {
  if (isSuperUserOrAdmin(permissionsObj)) return true;
  const value = normalizePermissionValue(permission);
  return value === 'lecture' || value === 'ecriture';
}

export function hasWriteAccess(permission, permissionsObj = null) {
  if (isSuperUserOrAdmin(permissionsObj)) return true;
  const value = normalizePermissionValue(permission);
  return value === 'ecriture';
}

export function getStoredPermissions() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem('user_permissions');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

export function hasAnyReadAccess(permissions, keys) {
  if (isSuperUserOrAdmin(permissions)) return true;
  if (!Array.isArray(keys) || keys.length === 0) return false;
  return keys.some((key) => hasReadAccess(permissions?.[key], permissions));
}

export function hasAnyWriteAccess(permissions, keys) {
  if (isSuperUserOrAdmin(permissions)) return true;
  if (!Array.isArray(keys) || keys.length === 0) return false;
  return keys.some((key) => hasWriteAccess(permissions?.[key], permissions));
}

export function useUserPermissions() {
  const [permissions, setPermissions] = useState(() => getStoredPermissions());

  useEffect(() => {
    setPermissions(getStoredPermissions());
    const handleStorage = () => setPermissions(getStoredPermissions());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('appConfigChanged', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('appConfigChanged', handleStorage);
    };
  }, []);

  const canRead = (permKey) => {
    if (Array.isArray(permKey)) return hasAnyReadAccess(permissions, permKey);
    return hasReadAccess(permissions?.[permKey], permissions);
  };

  const canWrite = (permKey) => {
    if (Array.isArray(permKey)) return hasAnyWriteAccess(permissions, permKey);
    return hasWriteAccess(permissions?.[permKey], permissions);
  };

  return { permissions, canRead, canWrite, isSuperAdmin: isSuperUserOrAdmin(permissions) };
}

