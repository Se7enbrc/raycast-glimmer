import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { promisify } from "node:util";
import { exitCodeMessage, parseApps, parsePCs, parseStatus } from "./contract";
import type { App, PC } from "./contract";

const execute = promisify(execFile);
const executablePaths = [
  "/usr/local/bin/glimmer",
  "/opt/homebrew/bin/glimmer",
  "/Applications/Glimmer.app/Contents/MacOS/Glimmer",
];

export const DOWNLOAD_URL = "https://github.com/Se7enbrc/glimmer/releases/latest";
export const HOMEBREW_COMMAND =
  "brew tap se7enbrc/glimmer && brew trust --tap se7enbrc/glimmer && brew install --cask glimmer";

export class MissingCLIError extends Error {
  constructor() {
    super("Install Glimmer, then choose Glimmer › Install Command Line Tool…");
    this.name = "MissingCLIError";
  }
}

export async function findCLI(): Promise<string> {
  for (const path of executablePaths) {
    try {
      await access(path, constants.X_OK);
      return path;
    } catch {
      // Try the next documented installation location.
    }
  }
  throw new MissingCLIError();
}

async function run(args: string[], pc?: string, timeout = 120_000): Promise<string> {
  const executable = await findCLI();
  try {
    const { stdout } = await execute(executable, args, {
      encoding: "utf8",
      timeout,
      maxBuffer: 8 * 1024 * 1024,
      // Argument arrays keep PC names and app names out of a shell.
      shell: false,
    });
    return stdout;
  } catch (error) {
    const failure = error as { code?: number | string; killed?: boolean };
    if (failure.code === "ENOENT") throw new MissingCLIError();
    if (failure.killed) throw new Error("Glimmer took too long to answer. Open Glimmer and try again.");
    // Do not expose arbitrary stderr, which can include protocol details.
    throw new Error(exitCodeMessage(typeof failure.code === "number" ? failure.code : null, pc));
  }
}

export async function listPCs(): Promise<PC[]> {
  return parsePCs(await run(["list", "--json"])).filter((pc) => pc.paired);
}

export async function readStatus() {
  return parseStatus(await run(["status", "--json"], undefined, 15_000));
}

export interface PCLibrary {
  pc: PC;
  apps: App[];
  error?: string;
}

export async function loadLibrary(): Promise<PCLibrary[]> {
  const pcs = await listPCs();
  // The PC list must finish first; each independent app list then loads in parallel.
  return Promise.all(
    pcs.map(async (pc): Promise<PCLibrary> => {
      try {
        return { pc, apps: parseApps(await run(["list", pc.id, "--json"], pc.name)) };
      } catch (error) {
        if (error instanceof MissingCLIError) throw error;
        return { pc, apps: [], error: errorMessage(error) };
      }
    }),
  );
}

export async function wakePC(pc: PC): Promise<void> {
  // Glimmer waits up to 90 seconds. Allow extra time for startup and teardown.
  await run(["wake", pc.id, "--wait"], pc.name);
}

export async function stopLiveStream(): Promise<boolean> {
  // Always read fresh status before stopping, even when the menu displays cached data.
  const status = await readStatus();
  if (!status.live) return false;
  if (!status.pc) throw new Error("Glimmer didn’t identify the streaming PC. Open Glimmer and try again.");
  await run(["stop", status.pc.id], status.pc.name, 20_000);
  return true;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Glimmer couldn’t complete the request. Try again.";
}
