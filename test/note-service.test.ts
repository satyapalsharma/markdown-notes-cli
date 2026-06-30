import { NoteService } from '../src/services/note-service';
import { NoteStorage } from '../src/data/note-storage';

jest.mock('../src/data/note-storage');

const MockedNoteStorage = NoteStorage as jest.MockedClass<typeof NoteStorage>;

describe('NoteService', () => {
  let service: NoteService;
  let mockStorage: jest.Mocked<NoteStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      ensureDirectory: jest.fn(),
      saveNote: jest.fn(),
      listNotes: jest.fn(),
      getNote: jest.fn(),
      deleteNote: jest.fn(),
    } as unknown as jest.Mocked<NoteStorage>;

    MockedNoteStorage.mockImplementation(() => mockStorage);
    service = new NoteService(mockStorage);
  });

  describe('createNote', () => {
    it('should create a note with the given title and content', () => {
      mockStorage.saveNote.mockReturnValue('my-note.md');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const result = service.createNote('My Note', '# My Note\n\nContent here.');

      expect(mockStorage.saveNote).toHaveBeenCalledWith('my-note', '# My Note\n\nContent here.');
      expect(result).toBe('my-note.md');
      spy.mockRestore();
    });

    it('should create a note with default content when none provided', () => {
      mockStorage.saveNote.mockReturnValue('meeting-notes.md');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const result = service.createNote('Meeting Notes');

      expect(mockStorage.saveNote).toHaveBeenCalledWith(
        'meeting-notes',
        expect.stringContaining('# Meeting Notes')
      );
      expect(result).toBe('meeting-notes.md');
      spy.mockRestore();
    });

    it('should sanitize title to create a valid filename', () => {
      mockStorage.saveNote.mockReturnValue('my-special-note.md');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const result = service.createNote('My Special! @Note# 123');

      expect(mockStorage.saveNote).toHaveBeenCalledWith(
        'my-special-note-123',
        expect.any(String)
      );
      expect(result).toBe('my-special-note.md');
      spy.mockRestore();
    });

    it('should ensure the notes directory exists before saving', () => {
      mockStorage.saveNote.mockReturnValue('note.md');

      service.createNote('Note');

      expect(mockStorage.ensureDirectory).toHaveBeenCalled();
    });

    it('should include the current date in default content', () => {
      mockStorage.saveNote.mockReturnValue('dated-note.md');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      service.createNote('Dated Note');

      const contentArg = mockStorage.saveNote.mock.calls[0][1];
      expect(contentArg).toContain('Dated Note');
      spy.mockRestore();
    });
  });

  describe('listNotes', () => {
    it('should return list of all notes', () => {
      mockStorage.listNotes.mockReturnValue([
        'note-one.md',
        'note-two.md',
        'note-three.md',
      ]);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const result = service.listNotes();

      expect(mockStorage.listNotes).toHaveBeenCalled();
      expect(result).toEqual(['note-one.md', 'note-two.md', 'note-three.md']);
      spy.mockRestore();
    });

    it('should return empty list when no notes exist', () => {
      mockStorage.listNotes.mockReturnValue([]);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const result = service.listNotes();

      expect(result).toEqual([]);
      spy.mockRestore();
    });

    it('should ensure the notes directory before listing', () => {
      mockStorage.listNotes.mockReturnValue([]);

      service.listNotes();

      expect(mockStorage.ensureDirectory).toHaveBeenCalled();
    });
  });

  describe('getNoteContent', () => {
    it('should return the content of a note', () => {
      const expectedContent = '# My Note\n\nFull content here.';
      mockStorage.getNote.mockReturnValue(expectedContent);

      const result = service.getNoteContent('my-note.md');

      expect(mockStorage.getNote).toHaveBeenCalledWith('my-note.md');
      expect(result).toBe(expectedContent);
    });

    it('should throw when note is not found', () => {
      mockStorage.getNote.mockImplementation(() => {
        throw new Error('File not found: missing-note.md');
      });

      expect(() => service.getNoteContent('missing-note.md')).toThrow('File not found: missing-note.md');
    });
  });

  describe('deleteNote', () => {
    it('should delete the specified note', () => {
      mockStorage.deleteNote.mockReturnValue(undefined);
      const spy = jest.spyOn(console, 'log').mockImplementation();

      service.deleteNote('my-note.md');

      expect(mockStorage.deleteNote).toHaveBeenCalledWith('my-note.md');
      spy.mockRestore();
    });

    it('should throw when trying to delete nonexistent note', () => {
      mockStorage.deleteNote.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => service.deleteNote('ghost.md')).toThrow();
    });
  });
});