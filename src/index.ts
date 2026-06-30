import { NoteService } from "./services/note-service";

const noteService = new NoteService();

function printHelp(): void {
  console.log(`
  📝 Markdown Notes CLI

  Usage:
    note <command> [options]

  Commands:
    create <title> [content]   Create a new markdown note
    list                       List all existing notes
    help                       Show this help message

  Examples:
    note create "My First Note"
    note create "Meeting Notes" "Discuss Q4 roadmap and deadlines."
    note list
  `);
}

function printNotes(notes: { title: string; filename: string; createdAt: Date }[]): void {
  if (notes.length === 0) {
    console.log("  No notes found. Create one with: note create <title>");
    return;
  }

  console.log(`\n  📋 Found ${notes.length} note(s):\n`);
  const maxTitleLen = Math.max(...notes.map((n) => n.title.length), 5);

  console.log(
    `  ${"Title".padEnd(maxTitleLen + 2)}${"File".padEnd(28)}Created`
  );
  console.log(`  ${"─".repeat(maxTitleLen + 2)}${"─".repeat(28)}${"─".repeat(22)}`);

  for (const note of notes) {
    const dateStr = note.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(`  ${note.title.padEnd(maxTitleLen + 2)}${note.filename.padEnd(28)}${dateStr}`);
  }
  console.log();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  switch (command) {
    case "create": {
      const title = args[1];
      if (!title) {
        console.error("  ❌ Error: Please provide a title for the note.");
        console.error("  Usage: note create <title> [content]");
        process.exit(1);
      }

      const content = args.slice(2).join(" ") || "";

      try {
        const note = await noteService.createNote(title, content);
        console.log(`  ✅ Note created: ${note.filename}`);
        console.log(`     Title: ${note.title}`);
        console.log(`     Path:  ${note.filePath}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Failed to create note: ${message}`);
        process.exit(1);
      }
      break;
    }

    case "list":
    case "ls": {
      try {
        const notes = await noteService.listNotes();
        printNotes(notes);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Failed to list notes: ${message}`);
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`  ❌ Unknown command: ${command}`);
      console.error("  Run 'note help' for available commands.");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("  ❌ An unexpected error occurred:", err);
  process.exit(1);
});