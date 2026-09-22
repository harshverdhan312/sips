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

  test('should correctly parse UI advertised example format with quoted commas in Skills', () => {
    const csv = `Name, Roll No, Email, Branch, Batch, CGPA, Skills
Aarav Sharma, 1RV21CS001, aarav@college.edu, Computer Science, 2025, 8.8, "Python, React, SQL"
Diya Patel, 1RV21CS002, diya@college.edu, Information Science, 2025, 9.1, "Java, Spring, Docker"`;

    const { students, errors } = parseCSV(csv);
    expect(errors).toHaveLength(0);
    expect(students).toHaveLength(2);
    expect(students[0].skills).toEqual(['python', 'react', 'sql']);
    expect(students[1].skills).toEqual(['java', 'spring', 'docker']);
  });

  test('should split quoted lines correctly and handle escaped double quotes', () => {
    const line = 'John Doe, 101, john@test.com, "Python, ""Advanced"" SQL"';
    const cols = splitCSVLine(line);
    expect(cols).toHaveLength(4);
    expect(cols[3]).toBe('Python, "Advanced" SQL');
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

  test('should validate CGPA bounds and report errors for out-of-range or non-numeric CGPA', () => {
    const csv = `Name, Roll No, Email, CGPA
Student High, 01, high@test.com, 11.5
Student Low, 02, low@test.com, -1.0
Student Text, 03, text@test.com, invalid_cgpa
Student Good, 04, good@test.com, 8.5`;

    const { students, errors } = parseCSV(csv);
    expect(students).toHaveLength(1);
    expect(students[0].name).toBe('Student Good');
    expect(students[0].cgpa).toBe(8.5);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain('CGPA must be a valid number between 0 and 10');
    expect(errors[1]).toContain('CGPA must be a valid number between 0 and 10');
    expect(errors[2]).toContain('CGPA must be a valid number between 0 and 10');
  });

  test('should detect duplicate students within the same CSV batch', () => {
    const csv = `Name, Roll No, Email
Student A, 1RV21CS001, dup@test.com
Student B, 1RV21CS002, other@test.com
Student C, 1RV21CS001, third@test.com
Student D, 1RV21CS004, dup@test.com`;

    const { students, errors } = parseCSV(csv);
    expect(students).toHaveLength(2);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('Duplicate student in CSV upload');
    expect(errors[1]).toContain('Duplicate student in CSV upload');
  });

  test('should throw error when CSV is empty or whitespace only', () => {
    expect(() => parseCSV('')).toThrow('CSV content must be a non-empty string');
    expect(() => parseCSV('   \n  \t  ')).toThrow('CSV content must be a non-empty string');
  });

  test('should throw error when CSV contains only a header line', () => {
    expect(() => parseCSV('Name, Roll No, Email')).toThrow('CSV must have a header row and at least one data row');
  });

  test('should throw error when header is missing required fields', () => {
    const csv = `Firstname, Age, City
John, 22, NYC`;

    expect(() => parseCSV(csv)).toThrow('CSV must have columns: Name, Roll No (or USN), Email');
  });
});
