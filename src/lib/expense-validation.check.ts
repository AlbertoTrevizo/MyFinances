import assert from "node:assert/strict";
import { dictionaries } from "../i18n/dictionaries";
import { readFields, validate, expenseFieldChanges, type EditableExpenseField } from "./expense-validation";

const valid = {
  description: "Coffee", notes: "", amount: "12.34", date: "2026-03-10",
  accountId: "account", categoryId: "", type: "needs", msi: false, msiMonths: "",
};
const form = new FormData();
for (const [key, value] of Object.entries(valid)) {
  if (typeof value === "string") form.set(key, ` ${value} `);
}
assert.deepEqual(readFields(form), valid, "GAS-6: trims form fields and preserves empty optional fields");
assert.deepEqual(readFields(new FormData()), {
  description: "", notes: "", amount: "", date: "", accountId: "", categoryId: "", type: "", msi: false, msiMonths: "",
}, "GAS-6: missing fields become empty strings");
form.set("notes", " note ");
form.set("categoryId", " category ");
form.set("msiMonths", " 03 ");
form.set("msi", "on");
assert.deepEqual(readFields(form), { ...valid, notes: "note", categoryId: "category", msi: true, msiMonths: "03" }, "GAS-6/GAS-11: reads optional fields and MSI values");
for (const value of ["true", " on ", "", "off"]) {
  form.set("msi", value);
  assert.equal(readFields(form).msi, false, "GAS-10: MSI requires the exact checkbox value on");
}

for (const t of Object.values(dictionaries)) {
  const e = t.expenses.errors;
  const broken = { ...valid, description: "", accountId: "", amount: "0", date: "bad", type: "bad", msi: true, msiMonths: "1" };
  for (const [field, fixed, message] of [
    ["description", valid.description, e.descriptionRequired],
    ["accountId", valid.accountId, e.accountRequired],
    ["amount", valid.amount, e.invalidAmount],
    ["date", valid.date, e.invalidDate],
    ["type", valid.type, e.typeRequired],
    ["msiMonths", "3", e.invalidMsiMonths],
  ] as const) {
    assert.equal(validate(broken, t), message, `GAS-7/GAS-25: ${field} precedes all later errors`);
    broken[field] = fixed;
  }
  assert.equal(validate(broken, t), null, "GAS-6/GAS-11: valid MSI form has no error");
  assert.equal(validate(valid, t), null, "GAS-6: optional notes and category may be empty");
  assert.equal(validate({ ...valid, msiMonths: "bad" }, t), null, "GAS-11: months are ignored when MSI is off");
  for (const amount of ["0", "-1", ".5", "1.", "1.234", "bad", "21474836.48"]) {
    assert.equal(validate({ ...valid, amount }, t), e.invalidAmount, `GAS-2/GAS-4: rejects form amount ${amount}`);
    assert.deepEqual(expenseFieldChanges("amount", amount, t), { error: e.invalidAmount }, `GAS-26/GAS-4: rejects inline amount ${amount}`);
  }
  for (const msiMonths of ["", "1", "37", "2.5", "3abc"]) {
    assert.equal(validate({ ...valid, msi: true, msiMonths }, t), e.invalidMsiMonths, `GAS-11: rejects form months ${msiMonths}`);
  }
  for (const type of ["needs", "wants", "savings"]) {
    assert.equal(validate({ ...valid, type }, t), null, `GAS-6: accepts ${type}`);
    assert.deepEqual(expenseFieldChanges("type", ` ${type} `, t), { changes: { type } }, `GAS-26: saves inline type ${type}`);
  }
  for (const [field, error] of [
    ["description", e.descriptionRequired], ["accountId", e.accountRequired],
    ["amount", e.invalidAmount], ["date", e.invalidDate], ["type", e.typeRequired],
  ] as const) {
    assert.deepEqual(expenseFieldChanges(field, " ", t), { error }, `GAS-26: rejects empty inline ${field}`);
    assert.deepEqual(expenseFieldChanges(field, null as unknown as string, t), { error }, `GAS-26: treats non-string inline ${field} as empty`);
  }
  for (const [field, raw, changes] of [
    ["description", " Coffee ", { description: "Coffee" }],
    ["accountId", " account ", { accountId: "account" }],
    ["categoryId", " category ", { categoryId: "category" }],
    ["categoryId", " ", { categoryId: null }],
    ["amount", " 1,2,3.45 ", { amountCents: 12345 }],
    ["date", " 2026-03-10 ", { date: new Date("2026-03-10T00:00:00Z") }],
    ["date", "2026-02-31", { date: new Date("2026-03-03T00:00:00Z") }],
  ] as const) {
    assert.deepEqual(expenseFieldChanges(field, raw, t), { changes }, `GAS-26/GAS-3: converts inline ${field} and preserves existing date normalization (D-7)`);
  }
  assert.equal(expenseFieldChanges("unknown" as EditableExpenseField, "x", t), undefined, "GAS-26: unknown inline field still produces no change");
}
console.log("expense-validation ok");
