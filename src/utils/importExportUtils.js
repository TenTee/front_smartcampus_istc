import * as XLSX from "xlsx";
import {
  arrayToCsv,
  downloadFile,
  parseCsvText,
  validateRows,
} from "./csvUtils";
import {
  classesService,
  etudiantsService,
  formateursService,
  inventairesService,
  modulesService,
  niveauxService,
  personnelsService,
  sallesService,
  emploiDuTempsService,
  filieresV2Service,
} from "../services/api/services";

const MULTI_VALUE_SEPARATORS = /[|;,]+/;
const DEFAULT_LABEL_FIELDS = [
  "nom",
  "name",
  "label",
  "intitule",
  "libelle",
  "code",
  "reference",
  "email",
];

const ENTITY_CONFIGS = {
  inventaires: {
    headers: ["reference", "nom", "quantite", "etat", "prix_unitaire"],
    required: ["reference", "nom"],
    lookupFields: {},
  },
  formateurs: {
    headers: ["nom", "email", "contact", "specialites"],
    required: ["nom", "contact"],
    lookupFields: {
      specialites: {
        service: modulesService,
        labelFields: ["intitule", "nom"],
        multi: true,
      },
    },
  },
  personnels: {
    headers: ["nom", "contact", "poste", "date_embauche", "salaire"],
    required: ["nom", "contact", "date_embauche"],
    lookupFields: {},
  },
  "emploi-du-temps": {
    headers: ["classe", "jour", "debut", "fin", "module", "formateur", "salle"],
    required: [
      "classe",
      "jour",
      "debut",
      "fin",
      "module",
      "formateur",
      "salle",
    ],
    lookupFields: {
      classe: {
        service: classesService,
        labelFields: ["nom", "classe_nom", "nom_classe"],
        multi: false,
      },
      module: {
        service: modulesService,
        labelFields: ["intitule", "nom", "module_nom", "code"],
        multi: false,
      },
      formateur: {
        service: formateursService,
        labelFields: ["nom", "email", "formateur_nom"],
        multi: false,
      },
      salle: {
        service: sallesService,
        labelFields: ["nom", "salle_nom", "code"],
        multi: false,
      },
    },
  },
  notes: {
    headers: [
      "etudiant_id",
      "etudiant_matricule",
      "etudiant_nom",
      "module_id",
      "module_nom",
      "classe_id",
      "classe_nom",
      "note_cc",
      "note_sn",
      "note_finale",
    ],
    required: ["etudiant_id", "module_id"],
    lookupFields: {},
  },
};

function toStringValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join("|");
  if (typeof value === "object")
    return value.label || value.nom || value.name || JSON.stringify(value);
  return String(value);
}

function splitMultiValue(value) {
  if (value === null || value === undefined) return [];
  const normalized = toStringValue(value);
  if (normalized === "") return [];
  return normalized
    .split(MULTI_VALUE_SEPARATORS)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRecordLabels(record, labelFields = []) {
  const labels = [];
  if (record == null) return labels;
  if (record.id !== undefined) labels.push(String(record.id));
  if (record._id !== undefined) labels.push(String(record._id));

  const fields = [...labelFields, ...DEFAULT_LABEL_FIELDS];
  fields.forEach((field) => {
    if (record[field] !== undefined && record[field] !== null) {
      const value = record[field];
      if (Array.isArray(value)) {
        value.forEach((item) => labels.push(String(item).trim()));
      } else {
        labels.push(String(value).trim());
      }
    }
  });
  return Array.from(new Set(labels.filter(Boolean))).map((value) =>
    value.toLowerCase(),
  );
}

function matchLookupRecord(value, records, labelFields = []) {
  if (value === null || value === undefined) return null;
  const raw = toStringValue(value);
  if (raw === "") return null;
  const normalized = raw.toLowerCase();

  const byId = records.find(
    (record) =>
      String(record.id) === raw ||
      String(record._id) === raw ||
      String(record.id) === normalized ||
      String(record._id) === normalized,
  );
  if (byId) return byId;

  return (
    records.find((record) =>
      getRecordLabels(record, labelFields).includes(normalized),
    ) || null
  );
}

export function getEntityImportConfig(entity) {
  return ENTITY_CONFIGS[entity] || null;
}

export async function fetchLookupDataForEntity(entity) {
  const config = getEntityImportConfig(entity);
  if (!config) return {};
  const lookupData = {};
  const entries = Object.entries(config.lookupFields || {});
  await Promise.all(
    entries.map(async ([field, fieldConfig]) => {
      try {
        const response = await fieldConfig.service.list();
        lookupData[field] = Array.isArray(response)
          ? response
          : response?.results || [];
      } catch (err) {
        lookupData[field] = [];
      }
    }),
  );
  return lookupData;
}

export function buildTemplateWorkbook(entity, config, lookupData) {
  const headers = config.headers || [];
  const sample = headers.reduce(
    (acc, header) => ({ ...acc, [header]: "" }),
    {},
  );
  const templateSheet = XLSX.utils.json_to_sheet([sample], { header: headers });

  const validationData = {};
  const validationHeaders = [];
  Object.entries(config.lookupFields || {}).forEach(([field, fieldConfig]) => {
    const listValues = (lookupData[field] || [])
      .map((record) => {
        const label = getRecordLabels(record, fieldConfig.labelFields).find(
          (value) =>
            value !== String(record.id) && value !== String(record._id),
        );
        return label || String(record.id || record._id || "");
      })
      .filter(Boolean);
    if (listValues.length > 0) {
      validationHeaders.push(field);
      validationData[field] = listValues;
    }
  });

  let hiddenSheet = null;
  if (validationHeaders.length > 0) {
    const validationRows = [
      validationHeaders.reduce(
        (acc, header) => ({ ...acc, [header]: header }),
        {},
      ),
    ];
    const rowCount =
      Math.max(
        ...Object.values(validationData).map((values) => values.length),
      ) || 0;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = {};
      validationHeaders.forEach((header) => {
        row[header] = validationData[header][rowIndex] || "";
      });
      validationRows.push(row);
    }
    hiddenSheet = XLSX.utils.json_to_sheet(validationRows, {
      header: validationHeaders,
    });

    const dataValidations = [];
    const maxRows = 100;
    validationHeaders.forEach((field) => {
      const colIndex = headers.indexOf(field);
      if (colIndex < 0) return;
      const columnLetter = XLSX.utils.encode_col(colIndex);
      const dataRange = `Validation!$${XLSX.utils.encode_col(validationHeaders.indexOf(field))}$2:$${XLSX.utils.encode_col(validationHeaders.indexOf(field))}$${validationData[field].length + 1}`;
      dataValidations.push({
        sqref: `${columnLetter}2:${columnLetter}${maxRows}`,
        type: "list",
        formula1: dataRange,
        showErrorMessage: true,
        errorTitle: "Valeur non valide",
        error: `Choisissez une valeur dans la liste pour le champ ${field}.`,
      });
    });
    templateSheet["!dataValidation"] = dataValidations;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  if (hiddenSheet) {
    XLSX.utils.book_append_sheet(workbook, hiddenSheet, "Validation");
  }
  return workbook;
}

export function downloadXlsxWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename);
}

export async function parseImportFile(file) {
  const filename = file.name.toLowerCase();
  if (filename.endsWith(".csv")) {
    return parseCsvText(await file.text());
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function normalizeLookupValues(rows, config, lookupData) {
  const errors = [];
  const resolvedRows = rows.map((row, rowIndex) => {
    const normalizedRow = { ...row };
    Object.entries(config.lookupFields || {}).forEach(
      ([field, fieldConfig]) => {
        const rawValue = row[field];
        if (
          rawValue === undefined ||
          rawValue === null ||
          String(rawValue).trim() === ""
        )
          return;
        if (fieldConfig.multi) {
          const values = splitMultiValue(rawValue);
          const ids = [];
          values.forEach((value) => {
            const match = matchLookupRecord(
              value,
              lookupData[field] || [],
              fieldConfig.labelFields || [],
            );
            if (!match) {
              errors.push({
                row: rowIndex + 2,
                field,
                message: `Valeur introuvable pour ${field}: ${value}`,
              });
            } else {
              ids.push(match.id ?? match._id);
            }
          });
          normalizedRow[field] = ids;
        } else {
          const match = matchLookupRecord(
            rawValue,
            lookupData[field] || [],
            fieldConfig.labelFields || [],
          );
          if (!match) {
            errors.push({
              row: rowIndex + 2,
              field,
              message: `Valeur introuvable pour ${field}: ${rawValue}`,
            });
          } else {
            normalizedRow[field] = match.id ?? match._id;
          }
        }
      },
    );
    return normalizedRow;
  });
  return { rows: resolvedRows, errors };
}

function getRecordDisplayName(record, labelFields = []) {
  if (!record) return "";
  const fields = [...labelFields, ...DEFAULT_LABEL_FIELDS];
  for (const field of fields) {
    const value = record[field];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return String(record.id ?? record._id ?? "");
}

export function formatExportRow(item, config, lookupData) {
  const row = {};
  (config.headers || []).forEach((header) => {
    const fieldConfig = config.lookupFields?.[header];
    const rawValue = item[header];

    if (!fieldConfig) {
      if (rawValue === undefined || rawValue === null) {
        row[header] = "";
      } else if (Array.isArray(rawValue)) {
        row[header] = rawValue.join("|");
      } else if (typeof rawValue === "object") {
        row[header] = getRecordDisplayName(rawValue, []);
      } else {
        row[header] = String(rawValue);
      }
      return;
    }

    if (Array.isArray(rawValue)) {
      const labels = rawValue
        .map((value) => {
          const match = matchLookupRecord(
            value,
            lookupData[header] || [],
            fieldConfig.labelFields || [],
          );
          return match
            ? getRecordDisplayName(match, fieldConfig.labelFields)
            : String(value);
        })
        .filter(Boolean);
      row[header] = labels.join("|");
      return;
    }

    if (typeof rawValue === "object" && rawValue !== null) {
      row[header] = getRecordDisplayName(rawValue, fieldConfig.labelFields);
      return;
    }

    const match = matchLookupRecord(
      rawValue,
      lookupData[header] || [],
      fieldConfig.labelFields || [],
    );
    if (match) {
      row[header] = getRecordDisplayName(match, fieldConfig.labelFields);
      return;
    }

    const altName =
      item[`${header}_nom`] ||
      item[`${header}_name`] ||
      item[`${header}_label`] ||
      item[`${header}_intitule`];
    row[header] = altName ? String(altName) : String(rawValue ?? "");
  });
  return row;
}

export function buildExportWorkbook(entity, items, config, lookupData) {
  const rows = items.map((item) => formatExportRow(item, config, lookupData));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: config.headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Export");
  return workbook;
}

export function createCsvFromExport(entity, items, config, lookupData) {
  const rows = items.map((item) => formatExportRow(item, config, lookupData));
  return arrayToCsv(config.headers, rows);
}

export async function downloadCsvExport(entity, items, config, lookupData) {
  const csv = createCsvFromExport(entity, items, config, lookupData);
  downloadFile(`${entity}_export.csv`, csv);
}
