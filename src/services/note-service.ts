import { ensureNotesDir, listNotes, createNote } from '../data/note-storage';

export interface NoteMetadata {
  filename: string;
  createdAt: Date;
}

export async function initializeNoteService(): Promise<void> {
  await ensureNotesDir();
}

export async function createNewNote(title: string, content: string = ''): Promise<string> {
  if (!title || title.trim() === '') {
    throw new Error('Note title cannot be empty');
  }

  const slug = generateSlug(title);
  const timestamp = Date.now();
  const filename = `${timestamp}-${slug}.md`;

  const fullContent = generateNoteContent(title, content);
  await createNote(filename, fullContent);

  return filename;
}

export async function getAllNotes(): Promise<NoteMetadata[]> {
  const filenames = await listNotes();

  return filenames
    .map(filename => parseNoteFilename(filename))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getNoteStats(): Promise<{ total: number; recent: number }> {
  const notes = await getAllNotes();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentNotes = notes.filter(note => note.createdAt >= oneWeekAgo);

  return {
    total: notes.length,
    recent: recentNotes.length
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

function generateNoteContent(title: string, content: string): string {
  const timestamp = new Date().toISOString();
  const header = `# ${title}\n\n`;

  if (content) {
    return header + content + '\n';
  }

  return header +
    `*Created on ${timestamp}*\n\n` +
    '---\n\n' +
    'Write your note here...\n';
}

function parseNoteFilename(filename: string): NoteMetadata {
  const match = filename.match(/^(\d+)-(.+)\.md$/);

  if (!match) {
    return {
      filename,
      createdAt: new Date()
    };
  }

  const timestamp = parseInt(match[1], 10);
  return {
    filename,
    createdAt: new Date(timestamp)
  };
}