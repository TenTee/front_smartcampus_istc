'use client';

import React from 'react';
import { Autocomplete, TextField, FormControl } from '@mui/material';

/**
 * SearchableSelect Component
 * A reusable dropdown component built on top of MUI Autocomplete.
 * Caps dropdown height at ~340px (8-10 items) with vertical scrolling,
 * enables searching/filtering, and keeps the selected value visible.
 */
export default function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  getOptionLabel = (option) => (option ? option.label || option.name || String(option) : ''),
  getOptionValue = (option) => (option ? option.value ?? option.id ?? option : ''),
  placeholder = 'Sélectionner...',
  disabled = false,
  error = false,
  helperText = '',
  fullWidth = true,
  size = 'small',
  required = false,
  sx = {},
}) {
  // Find current option object based on value
  const selectedOption =
    options.find((opt) => getOptionValue(opt) === value) || null;

  return (
    <FormControl fullWidth={fullWidth} error={error} sx={sx}>
      <Autocomplete
        size={size}
        disabled={disabled}
        options={options}
        value={selectedOption}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={(option, val) =>
          getOptionValue(option) === getOptionValue(val)
        }
        onChange={(event, newValue) => {
          onChange(newValue ? getOptionValue(newValue) : '');
        }}
        ListboxProps={{
          style: {
            maxHeight: 340,
            overflowY: 'auto',
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            helperText={helperText}
          />
        )}
      />
    </FormControl>
  );
}
