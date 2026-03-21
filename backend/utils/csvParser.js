/**
 * CSV Parser utility — parses CSV text into student records
 * Expected CSV format: Name, Roll No, Email
 */

const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.findIndex(h => h.includes('name'));
  const rollIdx = header.findIndex(h => h.includes('roll'));
  const emailIdx = header.findIndex(h => h.includes('email'));

  if (nameIdx === -1 || rollIdx === -1 || emailIdx === -1) {
    throw new Error('CSV must have columns: Name, Roll No, Email');
  }

  const students = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    
    const name = cols[nameIdx];
    const rollNo = cols[rollIdx];
    const email = cols[emailIdx];

    if (!name || !rollNo || !email) {
      errors.push(`Row ${i + 1}: Missing required field(s)`);
      continue;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
      continue;
    }

    students.push({ name, rollNo, email: email.toLowerCase() });
  }

  return { students, errors };
};

module.exports = { parseCSV };
