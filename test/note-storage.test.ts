import * as fs from 'fs';
import * as path from 'path';
import { NoteStorage } from '../src/data/note-storage';

jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('NoteStorage', () => {
  let storage: NoteStorage;
  const mockNotesDir = '/home/user/.markdown-notes';

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new NoteStorage(mockNotesDir);
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined);

      storage.ensureDirectory();

      expect(mockedFs.existsSync).toHaveBeenCalledWith(mockNotesDir);
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockNotesDir, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      mockedFs.existsSync.mockReturnValue(true);

      storage.ensureDirectory();

      expect(mockedFs.existsSync).toHaveBeenCalledWith(mockNotesDir);
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('saveNote', () => {
    it('should save a note with .md extension', () => {
      const filename = 'test-note';
      const content = '# Test Note\n\nThis is a test.';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/test-note.md`);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = storage.saveNote(filename, content);

      expect(mockedPath.join).toHaveBeenCalledWith(mockNotesDir, 'test-note.md');
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(`${mockNotesDir}/test-note.md`, content, 'utf-8');
      expect(result).toBe('test-note.md');
    });

    it('should handle filenames that already have .md extension', () => {
      const filename = 'test-note.md';
      const content = '# Test Note';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/test-note.md`);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = storage.saveNote(filename, content);

      expect(mockedPath.join).toHaveBeenCalledWith(mockNotesDir, 'test-note.md');
      expect(result).toBe('test-note.md');
    });

    it('should throw an error when write fails', () => {
      const filename = 'test-note';
      const content = '# Test Note';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/test-note.md`);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => storage.saveNote(filename, content)).toThrow('Permission denied');
    });
  });

  describe('listNotes', () => {
    it('should return only .md files', () => {
      mockedFs.readdirSync.mockReturnValue([
        'note1.md',
        'note2.md',
        'readme.txt',
        'note3.md',
        '.hidden.md',
      ] as unknown as fs.Dirent[]);

      const result = storage.listNotes();

      expect(result).toEqual(['note1.md', 'note2.md', 'note3.md', '.hidden.md']);
      expect(mockedFs.readdirSync).toHaveBeenCalledWith(mockNotesDir);
    });

    it('should return empty array when directory is empty', () => {
      mockedFs.readdirSync.mockReturnValue([] as unknown as fs.Dirent[]);

      const result = storage.listNotes();

      expect(result).toEqual([]);
    });

    it('should return empty array when no .md files exist', () => {
      mockedFs.readdirSync.mockReturnValue([
        'file.txt',
        'image.png',
      ] as unknown as fs.Dirent[]);

      const result = storage.listNotes();

      expect(result).toEqual([]);
    });
  });

  describe('getNote', () => {
    it('should read and return note content', () => {
      const filename = 'my-note.md';
      const expectedContent = '# My Note\n\nHello world.';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/${filename}`);
      mockedFs.readFileSync.mockReturnValue(expectedContent);

      const result = storage.getNote(filename);

      expect(mockedPath.join).toHaveBeenCalledWith(mockNotesDir, filename);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(`${mockNotesDir}/${filename}`, 'utf-8');
      expect(result).toBe(expectedContent);
    });

    it('should throw when file does not exist', () => {
      const filename = 'nonexistent.md';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/${filename}`);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error(`ENOENT: no such file or directory`);
      });

      expect(() => storage.getNote(filename)).toThrow();
    });
  });

  describe('deleteNote', () => {
    it('should delete a note file', () => {
      const filename = 'to-delete.md';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/${filename}`);
      (mockedFs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      storage.deleteNote(filename);

      expect(mockedPath.join).toHaveBeenCalledWith(mockNotesDir, filename);
      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(`${mockNotesDir}/${filename}`);
    });

    it('should throw when trying to delete a nonexistent file', () => {
      const filename = 'nonexistent.md';
      mockedPath.join.mockReturnValue(`${mockNotesDir}/${filename}`);
      (mockedFs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => storage.deleteNote(filename)).toThrow();
    });
  });
});