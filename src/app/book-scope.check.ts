// Run: node --import tsx src/app/book-scope.check.ts
import path from "node:path";
import ts from "typescript";

const files = ["src/app", "src/lib"].flatMap((directory) =>
  ts.sys.readDirectory(path.resolve(directory), [".ts", ".tsx"]),
).filter((file) => !file.endsWith(".check.ts"));
if (!files.includes(path.resolve("src/app/expenses/actions.ts"))) {
  throw new Error("src/app/expenses/actions.ts was not analyzed");
}
const models = new Set(["expense", "account", "category", "budget", "categoryBudget"]);
const methods = new Set([
  "findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow",
  "count", "aggregate", "groupBy", "create", "createMany", "update", "updateMany",
  "upsert", "delete", "deleteMany",
]);
let failures = 0;

function hasBookId(node: ts.Node): boolean {
  return (ts.isIdentifier(node) && node.text === "bookId")
    || ts.forEachChild(node, (child) => hasBookId(child) || undefined) === true;
}

for (const file of files) {
  const text = ts.sys.readFile(file);
  if (text === undefined) throw new Error(`Could not read ${file}`);
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const lines = text.split(/\r?\n/);
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const modelNode = node.expression.expression;
      if (ts.isPropertyAccessExpression(modelNode) && models.has(modelNode.name.text) && methods.has(method)) {
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
        const previous = lines[line - 1] ?? "";
        const marker = /^\s*\/\/\s*book-scope:/.test(previous);
        const exempt = /^\s*\/\/\s*book-scope:\s*\S.*$/.test(previous);
        if ((marker && !exempt) || (!exempt && !node.arguments.some(hasBookId))) {
          console.error(`${path.relative(process.cwd(), file)}:${line + 1} ${modelNode.name.text}.${method}`);
          failures++;
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures) process.exitCode = 1;
else console.log("book-scope ok");
