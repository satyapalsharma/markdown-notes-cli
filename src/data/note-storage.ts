import * as fs from 'fs';
import * as path from 'path';

export interface NoteMetadata {
  filename: string;
  title: string;
  createdAt: Date;
  size: number;
}

export interface Note extends NoteMetadata {
  content: string;
}

const DEFAULT_NOTES_DIR = 'notes';

function getNotesDirectory(baseDir?: string): string {
  const dir = baseDir || path.join(process.cwd(), DEFAULT_NOTES_DIR);
  return dir;
}

function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatNoteContent(title: string, body: string): string {
  const timestamp = new Date().toISOString();
  return `# ${title}\n\nCreated: ${timestamp}\n\n${body}\n`;
}

export function createNote(title: string, body: string = '', baseDir?: string): Note {
  const dir = getNotesDirectory(baseDir);
  ensureDirectoryExists(dir);

  const sanitized = sanitizeFilename(title);
  if (!sanitized) {
    throw new Error('Invalid note title: must contain at least one alphanumeric character.');
  }

  const filename = `${sanitized}.md`;
  const filePath = path.join(dir, filename);

  if (fs.existsSync(filePath)) {
    throw new Error(`A note with the title "${title}" already exists.`);
  }

  const content = formatNoteContent(title, body);
  fs.writeFileSync(filePath, content, 'utf-8');

  const stats = fs.statSync(filePath);

  return {
    filename,
    title,
    content,
    createdAt: stats.birthtime,
    size: stats.size,
  };
}

export function listNotes(baseDir?: string): NoteMetadata[] {
  const dir = getNotesDirectory(baseDir);
  ensureDirectoryExists(dir);

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const notes: NoteMetadata[] = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const filePath = path.join(dir, entry.name);
      const stats = fs.statSync(filePath);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : entry.name.replace(/\.md$/, '');

      return {
        filename: entry.name,
        title,
        createdAt: stats.birthtime,
        size: stats.size,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return notes;
}

export function getNote(filename: string, baseDir?: string): Note {
  const dir = getNotesDirectory(baseDir);
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Note not found: ${filename}`);
  }

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');

  return {
    filename,
    title,
    content,
    createdAt: stats.birthtime,
    size: stats.size,
  };
}

export function deleteNote(filename: string, baseDir?: string): void {
  const dir = getNotesDirectory(baseDir);
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Note not found: ${filename}`);
  }

  fs.unlinkSync(filePath);
}