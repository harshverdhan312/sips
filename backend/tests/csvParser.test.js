const { parseCSV, splitCSVLine } = require('../utils/csvParser');

describe('CSV Parser Utility', () => {
  test('should parse basic CSV with Name, Roll No, Email', () => {
    const csv = `Name, Roll No, Email
John Doe, CS101, john@test.com
Jane Smith, CS102, jane@test.com`;

    const { students, errors } = parseCSV(csv);
    expect(errors).toHaveLength(0);
    expect(students).toHaveLength(2);
    expect(students[0].name).toBe('John Doe');
    expect(students[0].rollNo).toBe('CS101');
    expect(students[0].email).toBe('john@test.com');
  });

  test('should parse extended CSV with Branch, Batch, CGPA, and Skills', () => {
    const csv = `Name, Roll No, Email, Branch, Batch, CGPA, Skills
Aarav Patel, 1RV21CS001, aarav@rvce.edu, Information Science, 2025, 8.8, "javascript; react; nodejs"`;

    const { students, errors } = parseCSV(csv);
    expect(errors).toHaveLength(0);
    expect(students).toHaveLength(1);
    expect(students[0].branch).toBe('Information Science');
    expect(students[0].batch).toBe('2025');
    expect(students[0].cgpa).toBe(8.8);
    expect(students[0].skills).toContain('javascript');
    expect(students[0].skills).toContain('react');
    expect(students[0].skills).toContain('nodejs');
  });

  test('should split quoted lines correctly without breaking on inner commas', () => {
    const line = 'John Doe, 101, john@test.com, "Python, React, AWS"';
    const cols = splitCSVLine(line);
    expect(cols).toHaveLength(4);
    expect(cols[3]).toBe('Python, React, AWS');
  });

  test('should flag rows with missing required columns as errors', () => {
    const csv = `Name, Roll No, Email
Valid Student, CS01, valid@test.com
, MissingName, noname@test.com
NoEmail, CS02, `;

    const { students, errors } = parseCSV(csv);
    expect(students).toHaveLength(1);
    expect(errors).toHaveLength(2);
  });

  test('should flag invalid email formats', () => {
    const csv = `Name, Roll No, Email
Student One, 01, notanemail
Student Two, 02, two@valid.org`;

    const { students, errors } = parseCSV(csv);
    expect(students).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid email format');
  });

  test('should throw error when header is missing required fields', () => {
    const csv = `Firstname, Age, City
John, 22, NYC`;

    expect(() => parseCSV(csv)).toThrow('CSV must have columns: Name, Roll No (or USN), Email');
  });
});
