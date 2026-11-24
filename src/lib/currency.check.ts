// Run: npx tsx src/lib/currency.check.ts
import { centsToPesosInput, formatCents, pesosToCents, pesosToCentsOrZero } from "./currency";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
for (const [input, cents] of [["10", 1000], ["0.01", 1], ["1.5", 150], [" 1.50 ", 150], ["21,474,836.47", 2147483647]] as const) {
  assert(pesosToCents(input) === cents, `GAS-2/GAS-4: accepts ${input} as ${cents} cents`);
  assert(pesosToCentsOrZero(input) === cents, `PRE-2: accepts ${input} as ${cents} budget cents`);
}
for (const [input, cents] of [["1,234.56", 123456], ["1,2,3", 12300]] as const) {
  assert(pesosToCents(input) === cents, `GAS-3: ignores commas in ${input}`);
  assert(pesosToCentsOrZero(input) === cents, `PRE-2/GAS-3: budget ignores commas in ${input}`);
}
for (const bad of ["Infinity", "1e10", "12abc", "text", "-5", ".5", "1.", "0.001", "1.234", "21,474,836.48", "30000000"]) {
  assert(pesosToCents(bad) === null, `GAS-4: rejects ${bad}`);
  assert(pesosToCentsOrZero(bad) === null, `PRE-2/GAS-4: budget rejects ${bad}`);
}
for (const zero of ["", "   ", "0", "0.00"]) {
  assert(pesosToCents(zero) === null, `GAS-4: expense rejects zero or empty ${JSON.stringify(zero)}`);
  assert(pesosToCentsOrZero(zero) === 0, `PRE-2: budget accepts zero or empty ${JSON.stringify(zero)}`);
}
assert(formatCents(123456) === "$1,234.56", "GAS-16: default amount display is Mexican pesos in Spanish");
assert(formatCents(123456, "es") === "$1,234.56", "GAS-16: Spanish amount display retains cents");
assert(formatCents(123456, "en") === "MX$1,234.56", "GAS-16: English amount display identifies Mexican pesos");
assert(formatCents(0, "es") === "$0.00", "PRE-13: remaining zero displays two decimal places");
for (const [cents, input] of [[0, "0.00"], [1, "0.01"], [150, "1.50"], [123456, "1234.56"], [2147483647, "21474836.47"]] as const) {
  assert(centsToPesosInput(cents) === input, `GAS-25/GAS-2: edit input for ${cents} cents is ${input}`);
}
console.log("currency ok");
