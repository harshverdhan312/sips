const zlib = require('zlib');
const logger = require('./logger');

/**
 * Robust extractor for student academic information (CGPA and Graduation Year/Batch)
 * from PDF resume buffers using stream decompression and regex heuristics.
 */

/**
 * Extracts printable text tokens from decompressed PDF stream content
 */
function parsePdfStreamText(content) {
  if (!content || typeof content !== 'string') return '';
  let extracted = '';

  // Extract from text operators: (text) Tj
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(content)) !== null) {
    const cleanToken = match[1].replace(/\\([()\\])/g, '$1');
    extracted += ' ' + cleanToken;
  }

  // Extract from array text operators: [(t) -10 (e) (x) (t)] TJ
  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(content)) !== null) {
    const inner = match[1];
    const stringMatches = inner.match(/\(([^)]+)\)/g);
    if (stringMatches) {
      const combined = stringMatches
        .map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
        .join('');
      extracted += ' ' + combined;
    }
  }

  // Also include general printable alphanumeric blocks
  const generalText = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  extracted += ' ' + generalText;

  return extracted;
}

/**
 * Extracts text from all streams in a PDF buffer
 */
function extractTextFromPdfBuffer(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) return '';
  let fullText = '';

  try {
    const rawString = pdfBuffer.toString('latin1');
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;

    while ((match = streamRegex.exec(rawString)) !== null) {
      const streamBytes = Buffer.from(match[1], 'latin1');
      let decompressed = null;

      try {
        decompressed = zlib.inflateSync(streamBytes).toString('utf-8');
      } catch (_) {
        try {
          decompressed = zlib.unzipSync(streamBytes).toString('utf-8');
        } catch (_) {
          try {
            decompressed = streamBytes.toString('utf-8');
          } catch (_) {
            decompressed = null;
          }
        }
      }

      if (decompressed) {
        fullText += ' ' + parsePdfStreamText(decompressed);
      }
    }
  } catch (err) {
    logger.warn('Error reading PDF streams:', err.message);
  }

  // Append raw printable characters as secondary fallback
  try {
    const printableOnly = pdfBuffer.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    fullText += ' ' + printableOnly;
  } catch (_) {}

  // Normalize excessive spaces
  return fullText.replace(/\s+/g, ' ').trim();
}

/**
 * Parses CGPA from extracted text using comprehensive patterns
 */
function extractCgpaFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Patterns for 10-point scale:
  // 1. "CGPA: 8.8", "CGPA : 8.85 / 10", "CGPA - 8.4"
  // 2. "8.8 / 10 CGPA", "8.75/10"
  // 3. "GPA: 9.1", "Grade Point Average: 8.5"
  // 4. "4.0 scale": "GPA: 3.8 / 4.0" -> converted to 10-point (3.8 * 2.5 = 9.5)
  const patterns = [
    // Standard CGPA with /10 scale explicitly mentioned: "CGPA: 8.8/10", "CGPA 9.2 / 10"
    /(?:cgpa|c\.g\.p\.a|gpa|grade\s*point\s*(?:average)?)\s*[:=\-–]?\s*([0-9](?:\.[0-9]{1,2})?)\s*(?:\/|\s+out\s+of\s+)\s*10(?:\.0)?/i,
    // Explicit CGPA label with score: "CGPA: 8.85", "CGPA - 7.9"
    /(?:cgpa|c\.g\.p\.a|grade\s*point\s*(?:average)?)\s*[:=\-–]?\s*([0-9](?:\.[0-9]{1,2})?)(?!\s*\%)/i,
    // Reversed: "8.85 / 10 CGPA", "8.5/10 (CGPA)"
    /([0-9](?:\.[0-9]{1,2})?)\s*(?:\/|\s+out\s+of\s+)\s*10(?:\.0)?\s*(?:cgpa|c\.g\.p\.a|gpa)?/i,
    // GPA on 4.0 scale: "GPA: 3.8 / 4.0"
    /(?:gpa)\s*[:=\-–]?\s*([0-3](?:\.[0-9]{1,2})?|4(?:\.0)?)\s*(?:\/|\s+out\s+of\s+)\s*4(?:\.0)?/i,
    // General GPA: "GPA: 8.5"
    /\bgpa\s*[:=\-–]?\s*([0-9](?:\.[0-9]{1,2})?)(?!\s*\%)/i
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match && match[1]) {
      let val = parseFloat(match[1]);
      if (!isNaN(val)) {
        // If matched 4.0 scale
        if (i === 3) {
          val = (val / 4.0) * 10;
        }
        if (val >= 1.0 && val <= 10.0) {
          return Math.round(val * 100) / 100;
        }
      }
    }
  }

  return null;
}

/**
 * Parses Graduation Year / Batch from extracted text
 */
function extractBatchFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Pattern 1: Explicit graduation/batch labels:
  // "Batch: 2021-2025" -> "2025"
  // "Graduation Year: 2026", "Year of Passing: 2025", "Class of 2025"
  const labelPatterns = [
    /(?:graduation\s*year|year\s*of\s*(?:passing|graduation)|class\s*of|graduating\s*in|expected\s*graduation)\s*[:=\-–]?\s*(?:20\d{2}\s*[-–]\s*)?(20[1-3]\d)/i,
    /\bbatch\s*[:=\-–]?\s*(?:20\d{2}\s*[-–]\s*)?(20[1-3]\d)/i,
    // Date range pattern for degree: "2021 - 2025" -> graduation year is 2025
    /(?:20[1-2]\d)\s*(?:-|–|to)\s*(20[1-3]\d)/i,
    // Degree with year: "B.Tech (2022 - 2026)" or "B.E. Computer Science 2025"
    /(?:b\.?tech|b\.?e\.?|m\.?tech|bca|mca|b\.?sc|m\.?sc)[^\n\r]{0,40}?(20[1-3]\d)/i
  ];

  for (const regex of labelPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const year = match[1].trim();
      const numYear = parseInt(year, 10);
      if (numYear >= 2018 && numYear <= 2035) {
        return year;
      }
    }
  }

  return null;
}

/**
 * Main function: Extracts academic details from PDF buffer
 */
function extractFromPdfBuffer(pdfBuffer) {
  const fullText = extractTextFromPdfBuffer(pdfBuffer);
  const extractedCgpa = extractCgpaFromText(fullText);
  const extractedBatch = extractBatchFromText(fullText);

  return {
    extractedCgpa,
    extractedBatch,
    rawTextLength: fullText.length
  };
}

module.exports = {
  extractFromPdfBuffer,
  extractTextFromPdfBuffer,
  extractCgpaFromText,
  extractBatchFromText
};
