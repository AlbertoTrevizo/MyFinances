// Run: npx tsx src/app/access.check.ts
import path from "node:path";
import ts from "typescript";

const app = path.resolve("src/app");
const files = ts.sys.readDirectory(app, [".ts", ".tsx", ".js", ".jsx"]);
if (!files.length) throw new Error(`No files found in ${app}`);
for (const required of ["users/page.tsx", "users/actions.ts"]) {
  if (!files.includes(path.join(app, required))) {
    throw new Error(`Required file not analyzed: ${path.join(app, required)}`);
  }
}
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const program = ts.createProgram(files, options);
if (!program.getSourceFile(path.resolve("src/lib/session.ts"))) {
  throw new Error("src/lib/session.ts was not resolved");
}
const checker = program.getTypeChecker();
const exemptions = [
  "login", "register", "confirm-email", "forgot-password", "reset-password",
  "api/auth/google", "complete-profile",
];
let failures = 0;

function fail(file: string, name: string, message: string) {
  console.error(`${path.relative(process.cwd(), file)}: ${name}: ${message}`);
  failures++;
}

function callsGuard(node: ts.Node, adminOnly: boolean): boolean {
  // A nested callback or helper is not the exported function's access check.
  if (ts.isFunctionLike(node)) return false;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const symbol = checker.getSymbolAtLocation(node.expression);
    if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
      const target = checker.getAliasedSymbol(symbol);
      const allowed = target.name === "requireAdmin" || (!adminOnly && target.name === "requireUser");
      if (allowed && target.declarations?.some((d) => path.resolve(d.getSourceFile().fileName) === path.resolve("src/lib/session.ts"))) {
        let parent = node.parent;
        while (ts.isParenthesizedExpression(parent)) parent = parent.parent;
        if (ts.isAwaitExpression(parent)) return true;
      }
    }
  }
  return ts.forEachChild(node, (child) => callsGuard(child, adminOnly) || undefined) === true;
}

function hasServerDirective(statements: ts.NodeArray<ts.Statement>): boolean {
  return statements.some((statement) =>
    ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === "use server"
  );
}

for (const file of files) {
  const relative = path.relative(app, file).split(path.sep).join("/");
  if (/^route\.(ts|tsx|js|jsx)$/.test(path.basename(file)) && !relative.startsWith("api/auth/google/")) {
    fail(file, "route", "decide access for this route before exempting it");
    continue;
  }
  if (exemptions.some((route) => relative.startsWith(`${route}/`))) continue;

  const source = program.getSourceFile(file)!;
  const adminOnly = relative.startsWith("users/");
  function checkInlineActions(node: ts.Node) {
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node))
      && node.body && ts.isBlock(node.body) && hasServerDirective(node.body.statements)
      && !callsGuard(node.body, adminOnly)) {
      const name = (!ts.isArrowFunction(node) && node.name?.getText(source))
        || (ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(source) : `inline action at line ${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
      fail(file, name, `must call ${adminOnly ? "requireAdmin()" : "requireUser() or requireAdmin()"}`);
    }
    ts.forEachChild(node, checkInlineActions);
  }
  checkInlineActions(source);

  const server = hasServerDirective(source.statements);
  const page = path.basename(file) === "page.tsx";
  if (!page && !server) continue;

  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
  if (page && !exports.some((symbol) => symbol.name === "default")) {
    fail(file, "default", "page must export a function with an access check");
  }
  for (const exported of exports) {
    if (!server && exported.name !== "default") continue;
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (!(symbol.flags & ts.SymbolFlags.Value)) continue;
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration) continue;
    const signatures = checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures();
    if (!signatures.length && !page) continue;
    const guarded = signatures.some((signature) => {
      const fn = signature.getDeclaration();
      return fn && (ts.isFunctionDeclaration(fn) || ts.isFunctionExpression(fn) || ts.isArrowFunction(fn))
        && fn.body && callsGuard(fn.body, adminOnly);
    });
    if (!guarded) {
      const name = ts.isFunctionDeclaration(declaration) && declaration.name ? declaration.name.text : exported.name;
      fail(file, name, `must call ${adminOnly ? "requireAdmin()" : "requireUser() or requireAdmin()"}`);
    }
  }
}

if (failures) process.exitCode = 1;
else console.log("access ok");
