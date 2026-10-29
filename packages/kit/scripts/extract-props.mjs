#!/usr/bin/env node
/**
 * Reads every exported component's props from the kit's TypeScript source and writes
 * src/props.generated.json: the exact props each component accepts, for AI tools and the Checker.
 * Run after changing a component's props: pnpm --filter @brandrail/kit run props
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "src/index.ts");
const configPath = join(root, "tsconfig.json");
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
const program = ts.createProgram([entry], { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const module = checker.getSymbolAtLocation(program.getSourceFile(entry));

const NATIVE = { InputHTMLAttributes: "input", TextareaHTMLAttributes: "textarea", ButtonHTMLAttributes: "button", AnchorHTMLAttributes: "a" };
const fromReact = (decl) => decl.getSourceFile().fileName.includes("node_modules");

function describeType(type) {
  const t = checker.getNonNullableType(type);
  const text = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType);
  // Enums: list the members so the AI knows the exact values (Size.SMALL, …).
  const sym = t.getSymbol() ?? t.aliasSymbol;
  if (sym && sym.flags & ts.SymbolFlags.Enum) {
    const members = [...(sym.exports?.keys() ?? [])].map((m) => `${sym.name}.${m}`);
    return `${sym.name} (${members.join(" | ")})`;
  }
  if (t.isUnion() && t.types.every((u) => u.flags & ts.TypeFlags.EnumLiteral)) {
    const name = t.types[0].symbol?.parent?.name ?? text;
    return `${name} (${t.types.map((u) => `${name}.${u.symbol.name}`).join(" | ")})`;
  }
  return text.replace(/import\("[^"]+"\)\./g, "").replace(/React\.ReactElement<unknown, string \| React\.JSXElementConstructor<any>>/g, "React.ReactElement");
}

const out = {};
for (const exp of checker.getExportsOfModule(module)) {
  const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
  const decl = sym.valueDeclaration ?? sym.declarations?.[0];
  if (!decl || !/^[A-Z]/.test(exp.name)) continue;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sig = type.getCallSignatures()[0];
  const param = sig?.getParameters()[0];
  if (!param) continue; // enums, constants
  const propsType = checker.getTypeOfSymbolAtLocation(param, decl);
  const props = [];
  let native;
  for (const p of propsType.getApparentProperties?.() ?? checker.getPropertiesOfType(propsType)) {
    const pd = p.valueDeclaration ?? p.declarations?.[0];
    if (!pd) continue;
    if (fromReact(pd)) {
      const owner = pd.parent && ts.isInterfaceDeclaration(pd.parent) ? pd.parent.name.text : "";
      native = NATIVE[owner] ?? native ?? "div";
      continue;
    }
    const doc = ts.displayPartsToString(p.getDocumentationComment(checker)).replace(/\s+/g, " ").trim();
    props.push({
      name: p.name,
      type: describeType(checker.getTypeOfSymbolAtLocation(p, pd)),
      ...(p.flags & ts.SymbolFlags.Optional ? {} : { required: true }),
      ...(doc ? { description: doc } : {}),
    });
  }
  props.sort((a, b) => Number(!!b.required) - Number(!!a.required) || a.name.localeCompare(b.name));
  out[exp.name] = { props, ...(native ? { htmlAttributes: native } : {}) };
}

const file = join(root, "src/props.generated.json");
writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote props for ${Object.keys(out).length} components → src/props.generated.json`);
