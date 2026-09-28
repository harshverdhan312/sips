/**
 * Robust CSV line splitter that handles commas inside quotes and escaped quotes ("")
 */
const splitCSVLine = (line) => {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote inside quotes: "" -> "
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(col => col.replace(/^"|"$/g, '').trim());
};

/**
 * CSV Parser utility — parses CSV text into student records
 * Required columns: Name, Roll No (or USN), Email
 * Optional columns: Branch, Batch, CGPA, Skills
 */
const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
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
  const branchIdx = header.findIndex(h => h.includes('branch') || h.includes('dept') || h.includes('department') || h.includes('specialization'));
  const courseIdx = header.findIndex(h => h.includes('course') || h.includes('program') || h.includes('degree'));
  const sectionIdx = header.findIndex(h => h.includes('section') || h.includes('sec'));
  const batchIdx = header.findIndex(h => h.includes('batch') || h.includes('year') || h.includes('grad'));
  const cgpaIdx = header.findIndex(h => h.includes('cgpa') || h.includes('gpa'));
  const skillsIdx = header.findIndex(h => h.includes('skill'));

  if (nameIdx === -1 || rollIdx === -1 || emailIdx === -1) {
    throw new Error('CSV must have columns: Name, Roll No (or USN), Email');
  }

  const students = [];
  const errors = [];
  const seenEmailsInCsv = new Set();
  const seenRollsInCsv = new Set();

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

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = rollNo.trim();

    // Email validation regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
      continue;
    }

    // CGPA validation
    let cgpa = 0;
    if (cgpaIdx !== -1 && cols[cgpaIdx] !== undefined && cols[cgpaIdx] !== '') {
      const parsedCgpa = parseFloat(cols[cgpaIdx]);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        errors.push(`Row ${i + 1}: CGPA must be a valid number between 0 and 10 (received "${cols[cgpaIdx]}")`);
        continue;
      }
      cgpa = parsedCgpa;
    }

    // Check duplicate in same CSV batch
    if (seenEmailsInCsv.has(cleanEmail) || seenRollsInCsv.has(cleanRoll)) {
      errors.push(`Row ${i + 1}: Duplicate student in CSV upload (${cleanEmail} / ${cleanRoll})`);
      continue;
    }
    seenEmailsInCsv.add(cleanEmail);
    seenRollsInCsv.add(cleanRoll);

    const studentRecord = {
      name: name.trim(),
      rollNo: cleanRoll,
      usn: cleanRoll,
      email: cleanEmail,
      course: courseIdx !== -1 && cols[courseIdx] ? cols[courseIdx].trim() : '',
      branch: branchIdx !== -1 && cols[branchIdx] ? cols[branchIdx].trim() : '',
      section: sectionIdx !== -1 && cols[sectionIdx] ? cols[sectionIdx].trim() : '',
      batch: batchIdx !== -1 && cols[batchIdx] ? cols[batchIdx].trim() : '',
      cgpa
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
