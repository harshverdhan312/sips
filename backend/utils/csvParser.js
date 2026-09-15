/**
 * Robust CSV line splitter that handles commas inside quotes
 */
const splitCSVLine = (line) => {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim().replace(/^"|"$/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, '').trim());
  return result;
};

/**
 * CSV Parser utility — parses CSV text into student records
 * Required columns: Name, Roll No (or USN), Email
 * Optional columns: Branch, Batch, CGPA, Skills
 */
const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV content must be a non-empty string');
  }

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Parse header
  const header = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const nameIdx = header.findIndex(h => h.includes('name'));
  const rollIdx = header.findIndex(h => h.includes('roll') || h.includes('usn'));
  const emailIdx = header.findIndex(h => h.includes('email'));
  const branchIdx = header.findIndex(h => h.includes('branch') || h.includes('dept') || h.includes('department'));
  const batchIdx = header.findIndex(h => h.includes('batch') || h.includes('year') || h.includes('grad'));
  const cgpaIdx = header.findIndex(h => h.includes('cgpa') || h.includes('gpa'));
  const skillsIdx = header.findIndex(h => h.includes('skill'));

  if (nameIdx === -1 || rollIdx === -1 || emailIdx === -1) {
    throw new Error('CSV must have columns: Name, Roll No (or USN), Email');
  }

  const students = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCSVLine(line);

    const name = cols[nameIdx];
    const rollNo = cols[rollIdx];
    const email = cols[emailIdx];

    if (!name || !rollNo || !email) {
      errors.push(`Row ${i + 1}: Missing required field(s) (Name, Roll No, or Email)`);
      continue;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
      continue;
    }

    const studentRecord = {
      name: name.trim(),
      rollNo: rollNo.trim(),
      usn: rollNo.trim(),
      email: email.toLowerCase().trim(),
      branch: branchIdx !== -1 && cols[branchIdx] ? cols[branchIdx].trim() : 'Computer Science & Engineering',
      batch: batchIdx !== -1 && cols[batchIdx] ? cols[batchIdx].trim() : '2025',
      cgpa: cgpaIdx !== -1 && !isNaN(parseFloat(cols[cgpaIdx])) ? parseFloat(cols[cgpaIdx]) : 7.5
    };

    if (skillsIdx !== -1 && cols[skillsIdx]) {
      studentRecord.skills = cols[skillsIdx]
        .split(/[;,|]/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    } else {
      studentRecord.skills = [];
    }

    students.push(studentRecord);
  }

  return { students, errors };
};

module.exports = { parseCSV, splitCSVLine };
