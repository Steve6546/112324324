import { normalizePath, validateName } from '../../../lib/db';

describe('Database Utilities', () => {
  describe('normalizePath', () => {
    it('ensures path starts with /', () => {
      expect(normalizePath('test.html')).toBe('/test.html');
      expect(normalizePath('folder/file.html')).toBe('/folder/file.html');
    });

    it('removes trailing slashes', () => {
      expect(normalizePath('/test.html/')).toBe('/test.html');
      expect(normalizePath('/folder/')).toBe('/folder');
    });

    it('collapses multiple slashes', () => {
      expect(normalizePath('//test//file.html')).toBe('/test/file.html');
      expect(normalizePath('///folder///file.html')).toBe('/folder/file.html');
    });

    it('resolves . and .. correctly', () => {
      expect(normalizePath('/folder/./file.html')).toBe('/folder/file.html');
      expect(normalizePath('/folder/../file.html')).toBe('/file.html');
      expect(normalizePath('/folder/subfolder/../../../file.html')).toBe('/file.html');
    });

    it('handles root path', () => {
      expect(normalizePath('/')).toBe('/');
    });

    it('throws error for invalid paths', () => {
      expect(() => normalizePath('')).toThrow('Invalid path: empty or not a string');
      expect(() => normalizePath(null as any)).toThrow('Invalid path: empty or not a string');
      expect(() => normalizePath('/  /')).toThrow('Invalid path segment');
    });
  });

  describe('validateName', () => {
    it('accepts valid names', () => {
      expect(validateName('valid.html')).toEqual({ valid: true });
      expect(validateName('my-file_123.js')).toEqual({ valid: true });
      expect(validateName('test')).toEqual({ valid: true });
      expect(validateName('file with spaces')).toEqual({ valid: true });
    });

    it('rejects empty names', () => {
      expect(validateName('')).toEqual({
        valid: false,
        error: 'Name cannot be empty'
      });
      expect(validateName('   ')).toEqual({
        valid: false,
        error: 'Name cannot be empty'
      });
    });

    it('rejects names that are too long', () => {
      const longName = 'a'.repeat(256);
      expect(validateName(longName)).toEqual({
        valid: false,
        error: 'Name too long (max 255 characters)'
      });
    });

    it('rejects forbidden characters', () => {
      const forbiddenChars = ['<', '>', ':', '"', '|', '?', '*', '\x00'];

      forbiddenChars.forEach(char => {
        expect(validateName(`file${char}.txt`)).toEqual({
          valid: false,
          error: 'Name contains invalid characters'
        });
      });
    });

    it('rejects reserved Windows names', () => {
      const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];

      reservedNames.forEach(name => {
        expect(validateName(name)).toEqual({
          valid: false,
          error: 'Reserved name not allowed'
        });
        // Names with extensions should be valid (only base name is checked)
        expect(validateName(`${name}.txt`)).toEqual({
          valid: true
        });
      });
    });
  });
});