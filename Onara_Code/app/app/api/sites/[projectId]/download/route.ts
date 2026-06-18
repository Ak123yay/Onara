import { createSign } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ProjectStatus = "queued" | "generating" | "deploying" | "live" | "failed" | "suspended";
type PlanType = "free" | "starter" | "pro";

type ProjectForDownload = {
  business_name: string;
  github_path: string | null;
  id: string;
  status: ProjectStatus;
};

type ProfileForDownload = {
  is_trial: boolean | null;
  plan: PlanType | null;
};

type GitHubConfig = {
  apiUrl: string;
  appId: string;
  branch: string;
  installationId: string;
  privateKey: string;
  repoName: string;
  repoOwner: string;
};

type GitHubTreeEntry = {
  path?: unknown;
  type?: unknown;
};

type GitHubFile = {
  content?: unknown;
  encoding?: unknown;
};

type ZipEntry = {
  data: Uint8Array;
  path: string;
};

const GITHUB_API_VERSION = "2022-11-28";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;

  if (!UUID_RE.test(projectId)) {
    return NextResponse.json({ error: "invalid_project_id", message: "Project id is invalid." }, { status: 400 });
  }

  if (!featureEnabled("FEATURE_CODE_DOWNLOAD", true)) {
    return NextResponse.json({ error: "code_download_disabled", message: "Code download is not enabled." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const [{ data: project, error: projectError }, { data: profile, error: profileError }] = await Promise.all([
    db
      .from("projects")
      .select("id, business_name, status, github_path")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectForDownload>(),
    db
      .from("users")
      .select("plan, is_trial")
      .eq("id", user.id)
      .maybeSingle<ProfileForDownload>(),
  ]);

  if (projectError) {
    return NextResponse.json(
      { error: "project_lookup_failed", message: projectError.message },
      { status: 500 },
    );
  }

  if (profileError) {
    return NextResponse.json(
      { error: "profile_lookup_failed", message: profileError.message },
      { status: 500 },
    );
  }

  if (!project) {
    return NextResponse.json({ error: "not_found", message: "Site was not found." }, { status: 404 });
  }

  if (!canDownloadCode(profile)) {
    return NextResponse.json(
      { error: "pro_required", message: "Code download is included with Pro." },
      { status: 403 },
    );
  }

  if (project.status !== "live") {
    return NextResponse.json(
      { error: "site_not_live", message: "Code can be downloaded after the site is live." },
      { status: 409 },
    );
  }

  const config = githubConfig();
  if ("missing" in config) {
    return NextResponse.json(
      {
        error: "github_not_configured",
        message: `Code download needs GitHub App settings: ${config.missing.join(", ")}.`,
      },
      { status: 503 },
    );
  }

  try {
    const pathPrefix = projectPathPrefix(project);
    const files = await fetchGitHubSiteFiles(config, pathPrefix);
    const folderName = `${slugify(project.business_name)}-${project.id.slice(0, 8)}`;
    const zip = buildZip([
      { path: `${folderName}/`, data: new Uint8Array() },
      {
        path: `${folderName}/README.txt`,
        data: new TextEncoder().encode(readmeFor(project, pathPrefix)),
      },
      ...files.map((file) => ({
        path: `${folderName}/${file.path}`,
        data: file.data,
      })),
    ]);
    const body = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
        "Content-Length": String(zip.byteLength),
        "Content-Type": "application/zip",
      },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare code download.";
    return NextResponse.json({ error: "code_download_failed", message }, { status: 502 });
  }
}

function canDownloadCode(profile: ProfileForDownload | null) {
  return profile?.is_trial === true || profile?.plan === "pro";
}

function featureEnabled(name: string, defaultValue: boolean) {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  return value.trim().toLowerCase() === "true";
}

function githubConfig(): GitHubConfig | { missing: string[] } {
  const values = {
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_INSTALLATION_ID: process.env.GITHUB_APP_INSTALLATION_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    return { missing };
  }

  return {
    apiUrl: (process.env.GITHUB_API_URL ?? "https://api.github.com").replace(/\/+$/, ""),
    appId: values.GITHUB_APP_ID!.trim(),
    branch: (process.env.GITHUB_REPO_BRANCH ?? "main").trim() || "main",
    installationId: values.GITHUB_APP_INSTALLATION_ID!.trim(),
    privateKey: normalizePrivateKey(values.GITHUB_APP_PRIVATE_KEY!),
    repoName: values.GITHUB_REPO_NAME!.trim(),
    repoOwner: values.GITHUB_REPO_OWNER!.trim(),
  };
}

function projectPathPrefix(project: ProjectForDownload) {
  const rawPath = project.github_path?.trim().replace(/^\/+|\/+$/g, "");
  if (!rawPath) {
    return `sites/${project.id}`;
  }

  const lastSegment = rawPath.split("/").at(-1) ?? "";
  if (/\.[a-z0-9]+$/i.test(lastSegment)) {
    return rawPath.split("/").slice(0, -1).join("/") || `sites/${project.id}`;
  }

  return rawPath;
}

async function fetchGitHubSiteFiles(config: GitHubConfig, pathPrefix: string): Promise<ZipEntry[]> {
  const token = await createInstallationToken(config);
  const ref = await githubRequest(config, `/repos/${config.repoOwner}/${config.repoName}/git/ref/heads/${encodePath(config.branch)}`, {
    token,
  });
  const commitSha = nestedString(ref, "object", "sha");

  if (!commitSha) {
    throw new Error("GitHub branch did not include a commit SHA.");
  }

  const tree = await githubRequest(config, `/repos/${config.repoOwner}/${config.repoName}/git/trees/${commitSha}?recursive=1`, {
    token,
  });
  const treeEntries = Array.isArray(tree.tree) ? tree.tree : [];
  const paths = treeEntries
    .filter((entry): entry is GitHubTreeEntry => isRecord(entry))
    .map((entry) => ({
      path: typeof entry.path === "string" ? entry.path : "",
      type: entry.type,
    }))
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(`${pathPrefix}/`))
    .map((entry) => entry.path)
    .sort();

  if (paths.length === 0) {
    throw new Error(`No generated files were found at ${pathPrefix}.`);
  }

  const files = await Promise.all(
    paths.map(async (path): Promise<ZipEntry | null> => {
      const payload = await githubRequest(config, `/repos/${config.repoOwner}/${config.repoName}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`, {
        token,
      }) as GitHubFile;
      const content = typeof payload.content === "string" ? payload.content : null;

      if (payload.encoding !== "base64" || !content) {
        return null;
      }

      return {
        data: new Uint8Array(Buffer.from(content.replace(/\s/g, ""), "base64")),
        path: safeRelativePath(path.slice(pathPrefix.length + 1)),
      };
    }),
  );

  return files.filter((file): file is ZipEntry => file !== null && file.path.length > 0);
}

async function createInstallationToken(config: GitHubConfig) {
  const appJwt = createGitHubAppJwt(config);
  const payload = await githubRequest(config, `/app/installations/${config.installationId}/access_tokens`, {
    method: "POST",
    token: appJwt,
  });
  const token = typeof payload.token === "string" ? payload.token : null;

  if (!token) {
    throw new Error("GitHub did not return an installation token.");
  }

  return token;
}

function createGitHubAppJwt(config: GitHubConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ exp: now + 540, iat: now - 60, iss: config.appId }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).end().sign(config.privateKey, "base64url");

  return `${unsignedToken}.${signature}`;
}

async function githubRequest(
  config: GitHubConfig,
  path: string,
  options: { method?: string; token: string },
): Promise<Record<string, unknown>> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${options.token}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    method: options.method ?? "GET",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(githubErrorMessage(response.status, text));
  }

  if (!text) {
    return {};
  }

  const payload: unknown = JSON.parse(text);
  if (!isRecord(payload)) {
    throw new Error("GitHub returned an unexpected response.");
  }

  return payload;
}

function githubErrorMessage(status: number, text: string) {
  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload) && typeof payload.message === "string") {
      return `GitHub API error (${status}): ${payload.message}`;
    }
  } catch {
    // Use the raw response below when GitHub does not return JSON.
  }

  return `GitHub API error (${status}): ${text.slice(0, 300) || "request failed"}`;
}

function buildZip(entries: ZipEntry[]) {
  const chunks: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;
  const timestamp = dosTimestamp(new Date());

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const data = Buffer.from(entry.data);
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(UTF8_FLAG, 6);
    localHeader.writeUInt16LE(STORE_METHOD, 8);
    localHeader.writeUInt16LE(timestamp.time, 10);
    localHeader.writeUInt16LE(timestamp.date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);

    chunks.push(localHeader, name, data);
    centralDirectory.push(centralHeader({ crc, dataLength: data.length, name, offset, timestamp }));
    offset += localHeader.length + name.length + data.length;
  }

  const centralStart = offset;
  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);

  return Buffer.concat([...chunks, ...centralDirectory, end]);
}

function centralHeader({
  crc,
  dataLength,
  name,
  offset,
  timestamp,
}: {
  crc: number;
  dataLength: number;
  name: Buffer;
  offset: number;
  timestamp: { date: number; time: number };
}) {
  const header = Buffer.alloc(46);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(UTF8_FLAG, 8);
  header.writeUInt16LE(STORE_METHOD, 10);
  header.writeUInt16LE(timestamp.time, 12);
  header.writeUInt16LE(timestamp.date, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(dataLength, 20);
  header.writeUInt32LE(dataLength, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(offset, 42);

  return Buffer.concat([header, name]);
}

function dosTimestamp(date: Date) {
  const year = Math.max(1980, date.getFullYear());

  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function safeRelativePath(path: string) {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function readmeFor(project: ProjectForDownload, pathPrefix: string) {
  return [
    "Onara site export",
    "",
    `Business: ${project.business_name}`,
    `Project: ${project.id}`,
    `Source folder: ${pathPrefix}`,
    `Downloaded: ${new Date().toISOString()}`,
    "",
    "This folder contains the generated site files backed up by Onara.",
    "",
  ].join("\n");
}

function normalizePrivateKey(value: string) {
  return value.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "onara-site";
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function nestedString(value: Record<string, unknown>, first: string, second: string) {
  const firstValue = value[first];
  if (!isRecord(firstValue)) {
    return null;
  }

  const secondValue = firstValue[second];
  return typeof secondValue === "string" ? secondValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
