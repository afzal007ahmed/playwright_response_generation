import * as fs from 'fs';
import * as path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface TestCase {
  id: string;
  payload: Record<string, any>;
}

export type SupportedFormat = 'json' | 'csv' | 'excel';

/**
 * 1. Checks and returns the supported file format or throws if invalid
 */
export function getFileFormat(filePath: string): SupportedFormat {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist at path: "${filePath}"`);
  }

  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.json':
      return 'json';
    case '.csv':
      return 'csv';
    case '.xlsx':
    case '.xls':
      return 'excel';
    default:
      throw new Error(`Unsupported file format "${ext}". Supported formats: .json, .csv, .xlsx, .xls`);
  }
}

/**
 * 2. Parses the raw file content into raw objects based on format
 */
export function parseRawData(filePath: string, format: SupportedFormat): any[] {
  switch (format) {
    case 'json': {
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax in "${filePath}": ${err.message}`);
      }
    }

    case 'csv': {
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const records = parseCsv(content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
        return records;
      } catch (err: any) {
        throw new Error(`Failed to parse CSV in "${filePath}": ${err.message}`);
      }
    }

    case 'excel': {
      try {
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Workbook contains no sheets.');
        }
        const worksheet = workbook.Sheets[firstSheetName];
        return XLSX.utils.sheet_to_json(worksheet);
      } catch (err: any) {
        throw new Error(`Failed to parse Excel file in "${filePath}": ${err.message}`);
      }
    }
  }
}

/**
 * 3. Validates and normalizes parsed records to ensure they match TestCase structure
 */
export function validateAndNormalizeTestCases(rawItems: any[]): TestCase[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Parsed data must be a non-empty list of test cases.');
  }

  const validatedCases: TestCase[] = [];
  const errors: string[] = [];

  rawItems.forEach((item, index) => {
    const rowNum = index + 1;

    if (!item || typeof item !== 'object') {
      errors.push(`Row/Item #${rowNum}: Expected an object, got ${typeof item}.`);
      return;
    }

    // Validate ID
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      errors.push(`Row/Item #${rowNum}: Missing or invalid required field 'id'.`);
      return;
    }

    // Validate and parse Payload
    let payload = item.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e: any) {
        errors.push(`Row/Item #${rowNum} (ID: ${item.id}): 'payload' string is not valid JSON (${e.message}).`);
        return;
      }
    }

    if (payload === undefined || payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      errors.push(`Row/Item #${rowNum} (ID: ${item.id}): 'payload' must be a valid JSON object.`);
      return;
    }

    validatedCases.push({
      id: item.id.trim(),
      payload,
    });
  });

  if (errors.length > 0) {
    throw new Error(`Test case validation failed:\n- ${errors.join('\n- ')}`);
  }

  return validatedCases;
}

/**
 * Main common function:
 * 1. Checks if format is valid
 * 2. Parses the file data
 * 3. Validates and normalizes the parsed data structure
 */
export function loadAndValidateTestCases(filePath: string): TestCase[] {
  const format = getFileFormat(filePath);
  const rawData = parseRawData(filePath, format);
  return validateAndNormalizeTestCases(rawData);
}

export default loadAndValidateTestCases;
