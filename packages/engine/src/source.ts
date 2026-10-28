export type FileKind = "jsx" | "vue" | "svelte" | "html" | "css" | "other";

export function fileKind(path: string): FileKind {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  if (["tsx", "jsx", "ts", "js", "mjs", "cjs", "mdx"].includes(ext)) return "jsx";
  if (ext === "vue") return "vue";
  if (ext === "svelte") return "svelte";
  if (["html", "htm", "astro"].includes(ext)) return "html";
  if (["css", "scss", "sass", "less", "pcss"].includes(ext)) return "css";
  return "other";
}

export const SCANNABLE = new Set<FileKind>(["jsx", "vue", "svelte", "html", "css"]);

const blank = (s: string) => s.replace(/[^\n]/g, " ");

/**
 * Replaces comments with spaces (keeping offsets and newlines) so rules don't fire on commented-out code.
 * JS-style comments are only stripped outside string literals.
 */
export function stripComments(code: string, kind: FileKind): string {
  let out = code;
  if (kind === "html" || kind === "vue" || kind === "svelte") {
    out = out.replace(/<!--[\s\S]*?-->/g, blank);
  }
  if (kind === "css") {
    return out.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + blank(m.slice(p1.length)));
  }
  // JS-ish scanner for jsx / vue / svelte / html <script>
  const chars = out.split("");
  let i = 0;
  let quote: string | null = null;
  while (i < chars.length) {
    const c = chars[i]!;
    const n = chars[i + 1];
    if (quote) {
      if (c === "\\") i += 2;
      else {
        if (c === quote) quote = null;
        i++;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = out.indexOf("*/", i + 2);
      const stop = end === -1 ? chars.length : end + 2;
      for (let j = i; j < stop; j++) if (chars[j] !== "\n") chars[j] = " ";
      i = stop;
      continue;
    }
    if (c === "/" && n === "/" && chars[i - 1] !== ":" && kind === "jsx") {
      while (i < chars.length && chars[i] !== "\n") chars[i++] = " ";
      continue;
    }
    i++;
  }
  return chars.join("");
}

export class LineIndex {
  private starts: number[] = [0];
  private text: string;
  constructor(text: string) {
    this.text = text;
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) this.starts.push(i + 1);
  }
  position(offset: number): { line: number; column: number } {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid]! <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - this.starts[lo]! + 1 };
  }
  lineText(line: number): string {
    const start = this.starts[line - 1] ?? 0;
    const end = this.starts[line] ?? this.text.length + 1;
    return this.text.slice(start, end - 1);
  }
  get lineCount() {
    return this.starts.length;
  }
}

/** Minimal glob matcher: supports **, *, ? and {a,b}. Paths use forward slashes. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        re += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "{") {
      const end = glob.indexOf("}", i);
      re += `(?:${glob.slice(i + 1, end).split(",").map((s) => s.replace(/[.+^$()|[\]\\]/g, "\\$&")).join("|")})`;
      i = end;
    } else re += c.replace(/[.+^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

export function makeIgnore(globs: string[]) {
  const res = globs.map(globToRegExp);
  return (path: string) => {
    const p = path.replace(/\\/g, "/").replace(/^\.\//, "");
    return res.some((r) => r.test(p) || r.test(`/${p}`));
  };
}
