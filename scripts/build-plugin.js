import fs from "fs";
import path from "path";
import archiver from "archiver";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const manifestPath = path.join(projectRoot, "src/manifest.json");

function ensureBuild() {
  execSync("npm run build", { cwd: projectRoot, stdio: "inherit" });
}

function packagePlugin() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json not found in src/");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Override version if env var is set
  const versionFromEnv = process.env.PLUGIN_VERSION;
  if (versionFromEnv) {
    // If tag starts with v (e.g. v1.0.2), strip it for the manifest version to be clean semantic version if needed,
    // but Super Productivity might be fine with 'v'.
    // However, usually manifest versions are X.Y.Z.
    // Let's keep it simple: use the env var as is, or strip 'v' if it exists?
    // The user said: "Use the tag name which triggered the pipeline".
    // If the tag is "v1.0.2", the filename should probably be "quest-arc-v1.0.2.zip".
    // The manifest version usually should be "1.0.2".
    // Let's strip 'v' for manifest, but use full tag for filename if desired.
    // Actually, let's just use what is given, but maybe ensure manifest is clean?
    // Let's perform a simple check: if it starts with 'v' and followed by digit, strip 'v' for manifest.

    let cleanVersion = versionFromEnv;
    if (cleanVersion.startsWith("v") && /^\d/.test(cleanVersion.substring(1))) {
      cleanVersion = cleanVersion.substring(1);
    }

    manifest.version = cleanVersion;
    console.log(
      `Updated manifest version to ${cleanVersion} (from ${versionFromEnv})`,
    );

    // Update the manifest in dist folder before zipping
    if (!fs.existsSync(distDir)) {
      throw new Error("dist folder not found. Run the build step first.");
    }
    fs.writeFileSync(
      path.join(distDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  }

  const filenameVersion = versionFromEnv ? `-${versionFromEnv}` : "";
  const outputFileName = `${manifest.id}${filenameVersion}.zip`;
  const output = fs.createWriteStream(path.join(projectRoot, outputFileName));
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    console.log(
      `Plugin packaged successfully: ${outputFileName} (${(
        archive.pointer() / 1024
      ).toFixed(2)} KB)`,
    );
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);

  if (!fs.existsSync(distDir)) {
    throw new Error("dist folder not found. Run the build step first.");
  }

  archive.directory(distDir, false);

  return archive.finalize();
}

async function run() {
  ensureBuild();
  await packagePlugin();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
