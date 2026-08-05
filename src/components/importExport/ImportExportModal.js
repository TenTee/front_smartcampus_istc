import React, { useEffect, useState } from "react";
import {
  buildTemplateWorkbook,
  createCsvFromExport,
  fetchLookupDataForEntity,
  getEntityImportConfig,
  normalizeLookupValues,
  parseImportFile,
  downloadXlsxWorkbook,
} from "../../utils/importExportUtils";
import { downloadFile, validateRows } from "../../utils/csvUtils";
import * as apiServices from "../../services/api/services";
import { notesV2Service } from "../../services/api/services";

export default function ImportExportModal({
  entity = "inventaires",
  onComplete,
  filters = null,
}) {
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState([]);
  const [lookupData, setLookupData] = useState({});
  const [importReport, setImportReport] = useState(null);

  const config = getEntityImportConfig(entity);

  useEffect(() => {
    if (entity !== "notes") {
      fetchLookupDataForEntity(entity)
        .then(setLookupData)
        .catch(() => setLookupData({}));
    }
  }, [entity]);

  function getServiceForEntity(e) {
    switch (e) {
      case "inventaires":
        // Inventory UI works with articles service (inventaire v2 articles)
        return apiServices.articlesService || apiServices.inventairesService;
      case "formateurs":
        return apiServices.formateursService;
      case "personnels":
        return apiServices.personnelsService;
      case "emploi-du-temps":
        return apiServices.emploiDuTempsService;
      case "notes":
        return notesV2Service;
      default:
        return null;
    }
  }

  async function handleDownloadTemplate() {
    setStatus("Préparation du modèle...");
    setErrors([]);
    try {
      if (entity === "notes") {
        const blob = await notesV2Service.exportTemplate({});
        const url = window.URL.createObjectURL(new Blob([blob]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "notes_template.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus("Modèle téléchargé");
        return;
      }

      const entityConfig = config || { headers: [], required: [] };
      const workbook = buildTemplateWorkbook(entity, entityConfig, lookupData);
      downloadXlsxWorkbook(workbook, `${entity}_template.xlsx`);
      setStatus("Modèle téléchargé");
    } catch (err) {
      setStatus(null);
      setErrors([{ message: err.message || String(err) }]);
    }
  }

  async function handleExport() {
    setStatus("Export en cours...");
    setErrors([]);
    try {
      const service = getServiceForEntity(entity);
      if (!service) throw new Error("Service introuvable pour l'entité");

      let items = [];
      // Use provided filters when available (e.g. { classe: id })
      if (service.list) {
        items = await service.list(filters || {});
      } else if (service.get) {
        items = await service.get();
      } else {
        throw new Error("Impossible de récupérer les données pour export");
      }

      if (!Array.isArray(items)) {
        items = items.results || items.data || [];
      }

      const entityConfig = config || {
        headers: Object.keys(items[0] || {}),
        required: [],
      };
      if (!entityConfig.headers || entityConfig.headers.length === 0) {
        entityConfig.headers = Object.keys(items[0] || {});
      }

      // For notes entity, exports should be contextual (handled by views)
      if (entity === "notes") {
        throw new Error(
          "L'export principal des notes doit être lancé depuis la vue 'Notes par classe'.",
        );
      }

      const csv = createCsvFromExport(entity, items, entityConfig, lookupData);
      downloadFile(`${entity}_export.csv`, csv);
      setStatus("Export terminé");
    } catch (err) {
      setStatus(null);
      setErrors([{ message: err.message || String(err) }]);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStatus("Lecture du fichier...");
    setErrors([]);

    try {
      if (entity === "notes") {
        const formData = new FormData();
        formData.append("file", file);
        await notesV2Service.importNotes(formData);
        setStatus("Import notes terminé");
        onComplete && onComplete();
        return;
      }

      const { headers, rows } = await parseImportFile(file);
      const entityConfig = config || { headers, required: [] };
      const validation = validateRows(
        headers,
        rows,
        entityConfig.required || [],
      );
      if (validation.length) {
        setErrors(validation);
        setStatus(null);
        return;
      }

      const normalization = normalizeLookupValues(
        rows,
        entityConfig,
        lookupData,
      );
      if (normalization.errors.length) {
        setErrors(normalization.errors);
        setStatus("Import terminé avec erreurs");
        return;
      }

      const service = getServiceForEntity(entity);
      if (!service || !service.create)
        throw new Error("Service de création introuvable");

      const failures = [];
      const imported = [];
      for (let i = 0; i < normalization.rows.length; i++) {
        const row = normalization.rows[i];
        try {
          const result = await service.create(row);
          imported.push(result);
        } catch (err) {
          failures.push({
            row: i + 2,
            message: err.response?.data || err.message || String(err),
          });
        }
      }

      const report = {
        total: rows.length,
        imported: imported.length,
        failed: failures.length,
        failures,
      };
      setImportReport(report);

      if (failures.length) {
        setErrors(failures);
        setStatus("Import terminé avec erreurs");
      } else {
        setStatus("Import terminé");
        onComplete && onComplete();
      }
    } catch (err) {
      setErrors([{ message: err.message || String(err) }]);
      setStatus(null);
    }
  }

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Import / Export</strong> — Entité: {entity}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={handleDownloadTemplate}>Télécharger modèle</button>
        {entity !== "notes" && (
          <button onClick={handleExport}>Exporter CSV</button>
        )}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "inline-block" }}
          />
        </label>
      </div>
      {status && <div style={{ color: "green" }}>{status}</div>}
      {errors && errors.length > 0 && (
        <div style={{ marginTop: 8, color: "crimson" }}>
          <strong>Erreurs ({errors.length}):</strong>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>
                {err.row ? `Ligne ${err.row}: ` : ""}
                {err.field ? `${err.field} — ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
