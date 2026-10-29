#!/usr/bin/env node
/**
 * Publishes the kit to GitHub Packages (private, free).
 *
 * GitHub Packages only accepts packages scoped to the repo owner, so the kit is published as
 * `@thibaptistella/kit`. Apps install it under its usual name with an npm alias:
 *   npm i @brandrail/kit@npm:@thibaptistella/kit
 * so imports, AI rules and the Brandrail CLI keep using `@brandrail/kit`.
 *
 * Needs NODE_AUTH_TOKEN (or a ~/.npmrc entry for npm.pkg.github.com) holding a GitHub
 * classic token with `write:packages`. Pass --dry-run to check without uploading.
 */
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "thibaptistella";
const REPO = "ThiBaptistella/brandrail";
const REGISTRY = "https://npm.pkg.github.com";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".publish");
const dryRun = process.argv.includes("--dry-run");
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: "inherit" });

run("pnpm run build");

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
cpSync(join(root, "dist"), join(out, "dist"), { recursive: true });
cpSync(join(root, "README.md"), join(out, "README.md"));

const src = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const { publishConfig = {}, scripts, devDependencies, ...rest } = src;
const { access, registry, ...fields } = publishConfig; // main/module/types/exports → dist
const pkg = {
  ...rest,
  ...fields,
  name: `@${OWNER}/kit`,
  repository: { type: "git", url: `git+https://github.com/${REPO}.git`, directory: "packages/kit" },
  publishConfig: { registry },
};
pkg.publishConfig.registry = REGISTRY;
writeFileSync(join(out, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
writeFileSync(join(out, ".npmrc"), `@${OWNER}:registry=${REGISTRY}\n${process.env.NODE_AUTH_TOKEN ? "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n" : ""}`);

run(`npm publish${dryRun ? " --dry-run" : ""}`, out);
console.log(`\n${dryRun ? "Dry run OK" : "Published"}: ${pkg.name}@${pkg.version}`);
console.log(`Install in an app:  npm i @brandrail/kit@npm:${pkg.name}@^${pkg.version}`);
