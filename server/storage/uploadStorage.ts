import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, unlink } from "fs/promises";
import { resolve, sep } from "path";

/**
 * Pluggable upload-storage backend. The goal of this abstraction is to let
 * the team move file blobs off Postgres (where they live today as base64
 * strings in `uploads.file_data`) to object storage without touching
 * every route that reads or writes a file.
 *
 * Choose a backend via `UPLOAD_BACKEND`:
 *   - `db`    — (default) base64-encoded blob stored in Postgres via the
 *               existing storage layer. This is still what the schema does.
 *   - `local` — writes to `./var/uploads/<key>` and stores only the key
 *               in Postgres. Good for Replit's persistent disk and VPS
 *               deployments. Eliminates row bloat and pg_dump size issues.
 *   - `s3`    — stub. Wire with `@aws-sdk/client-s3` when credentials exist.
 */

export interface UploadPutInput {
  /** The raw bytes to store. */
  buffer: Buffer;
  /** MIME type for the stored object. */
  contentType: string;
  /** Optional stable suffix so local-disk files keep their extension. */
  fileNameHint?: string;
}

/** Where a stored object lives after a `put()`. */
export type UploadLocation =
  | { kind: "db-base64"; fileData: string }
  | { kind: "external"; storageKey: string };

export interface UploadBackend {
  /** Unique kind of this backend — drives which DB column receives the key. */
  readonly kind: "db" | "local" | "s3";
  /** Write the buffer and return where it landed. */
  put(input: UploadPutInput): Promise<UploadLocation>;
  /** Fetch the bytes by storage key. Unused for `db-base64`. */
  get(key: string): Promise<Buffer>;
  /** Best-effort delete; errors are swallowed to keep cleanup idempotent. */
  remove(key: string): Promise<void>;
}

/** Decode a DB-base64 payload without going through a backend. */
export function decodeBase64Payload(payload: string): Buffer {
  return Buffer.from(payload, "base64");
}

/**
 * Pass-through backend that lets the existing Postgres-base64 path keep
 * working. The "key" is the base64 payload itself — this means reads /
 * writes continue to use whatever storage.createUpload / storage.getUploadById
 * already do; this backend exists so routes can switch on an identical
 * interface without branching on a feature flag.
 */
class DbBase64Backend implements UploadBackend {
  readonly kind = "db" as const;
  async put({ buffer }: UploadPutInput): Promise<UploadLocation> {
    return { kind: "db-base64", fileData: buffer.toString("base64") };
  }
  async get(key: string): Promise<Buffer> {
    return Buffer.from(key, "base64");
  }
  async remove(_key: string): Promise<void> {
    // No-op — the row deletion elsewhere removes the blob.
  }
}

class LocalDiskBackend implements UploadBackend {
  readonly kind = "local" as const;
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = resolve(rootDir);
    if (!existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true });
    }
  }

  private safePath(key: string): string {
    const full = resolve(this.root, key);
    if (!full.startsWith(this.root + sep) && full !== this.root) {
      throw new Error("Invalid storage key — path traversal blocked");
    }
    return full;
  }

  async put({ buffer, fileNameHint }: UploadPutInput): Promise<UploadLocation> {
    const ext = fileNameHint?.includes(".") ? fileNameHint.slice(fileNameHint.lastIndexOf(".")) : "";
    const key = `${randomUUID()}${ext}`;
    await writeFile(this.safePath(key), buffer);
    return { kind: "external", storageKey: key };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.safePath(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.safePath(key));
    } catch {
      // Ignore — file may already be gone.
    }
  }
}

function pickBackend(): UploadBackend {
  const requested = (process.env.UPLOAD_BACKEND || "db").toLowerCase();
  switch (requested) {
    case "local": {
      const dir = process.env.UPLOAD_LOCAL_DIR || resolve(process.cwd(), "var", "uploads");
      return new LocalDiskBackend(dir);
    }
    case "s3":
      // Intentional: this branch exists to document the extension point.
      throw new Error(
        "S3 backend not implemented yet. Set UPLOAD_BACKEND=db or UPLOAD_BACKEND=local.",
      );
    case "db":
    default:
      return new DbBase64Backend();
  }
}

let cached: UploadBackend | null = null;

export function getUploadBackend(): UploadBackend {
  if (!cached) cached = pickBackend();
  return cached;
}

/** Test seam — overrides the cached backend. */
export function setUploadBackendForTests(backend: UploadBackend | null): void {
  cached = backend;
}

interface UploadRowLike {
  fileData: string | null;
  storageKey?: string | null;
}

/**
 * Read the bytes for an upload row regardless of where they live:
 *   - row.storageKey set → read from the configured external backend
 *   - else → decode row.fileData (legacy DB-base64 rows)
 */
export async function readUploadBytes(row: UploadRowLike): Promise<Buffer> {
  if (row.storageKey) {
    return getUploadBackend().get(row.storageKey);
  }
  if (!row.fileData) {
    throw new Error("Upload row has neither storageKey nor fileData");
  }
  return decodeBase64Payload(row.fileData);
}
