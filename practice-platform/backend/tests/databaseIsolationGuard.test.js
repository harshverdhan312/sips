const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { verifyTestDatabaseTarget } = require('./testHelper');
const config = require('../src/config');
const prisma = require('../src/utils/prisma');

describe('Database Isolation & Safety Guard Verification', () => {
  describe('1. verifyTestDatabaseTarget Safety Guard', () => {
    test('allows dedicated sips_practice_test database URL', () => {
      expect(() => {
        verifyTestDatabaseTarget('postgresql://postgres:password@localhost:5432/sips_practice_test?schema=public');
      }).not.toThrow();
    });

    test('allows any database ending with _test', () => {
      expect(() => {
        verifyTestDatabaseTarget('postgresql://user:pass@localhost:5432/custom_db_test');
      }).not.toThrow();
    });

    test('strictly throws on development database (sips_practice)', () => {
      expect(() => {
        verifyTestDatabaseTarget('postgresql://postgres:harshsage@0312@localhost:5432/sips_practice?schema=public');
      }).toThrow(/cleanDatabase refused to execute against database "sips_practice"/);
    });

    test('strictly throws on production or non-test database', () => {
      expect(() => {
        verifyTestDatabaseTarget('postgresql://user:pass@localhost:5432/production_sips');
      }).toThrow(/Destructive cleanup operations are only permitted on dedicated test databases/);
    });

    test('throws when database URL is empty or invalid', () => {
      expect(() => {
        verifyTestDatabaseTarget('');
      }).toThrow(/DATABASE_URL is not set/);
    });
  });

  describe('2. Test Environment Database Target', () => {
    test('Jest environment is running against sips_practice_test', () => {
      expect(config.isTest).toBe(true);
      expect(process.env.DATABASE_URL).toContain('sips_practice_test');
    });

    test('PrismaClient connects to test database', async () => {
      const result = await prisma.$queryRawUnsafe('SELECT current_database() as db_name;');
      expect(result[0].db_name).toBe('sips_practice_test');
    });
  });

  describe('3. Development Environment Configuration Isolation', () => {
    test('Root backend .env file targets sips_practice and not sips_practice_test', () => {
      const devEnvPath = path.resolve(__dirname, '../.env');
      expect(fs.existsSync(devEnvPath)).toBe(true);
      const devEnvContent = fs.readFileSync(devEnvPath, 'utf8');
      const parsed = dotenv.parse(devEnvContent);
      expect(parsed.DATABASE_URL).toContain('sips_practice');
      expect(parsed.DATABASE_URL).not.toContain('sips_practice_test');
    });

    test('.env.test file targets sips_practice_test', () => {
      const testEnvPath = path.resolve(__dirname, '../.env.test');
      expect(fs.existsSync(testEnvPath)).toBe(true);
      const testEnvContent = fs.readFileSync(testEnvPath, 'utf8');
      const parsed = dotenv.parse(testEnvContent);
      expect(parsed.DATABASE_URL).toContain('sips_practice_test');
    });
  });
});
