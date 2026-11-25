import assert from "node:assert/strict";
import { dictionaries } from "../i18n/dictionaries";
import { readFields, parseDayOfMonth, validateAccount, accountFieldChanges, type EditableAccountField } from "./account-validation";

const valid = { name: "Bank", type: "Debit", cutoffDay: "15", paymentDay: "31" };
const form = new FormData();
for (const [key, value] of Object.entries(valid)) form.set(key, ` ${value} `);
assert.deepEqual(readFields(form), valid, "CUE-5/CUE-6: trims account form fields");
assert.deepEqual(readFields(new FormData()), { name: "", type: "", cutoffDay: "", paymentDay: "" }, "CUE-6: missing account fields become empty strings");
assert.equal(parseDayOfMonth(""), null, "CUE-10: empty day clears it");
for (const day of ["1", "31", "15", "01"]) {
  assert.equal(parseDayOfMonth(day), Number(day), `CUE-8: accepts day ${day} for any account type`);
}
for (const day of ["0", "32", "-1", "bad", " ", "Infinity"]) {
  assert.equal(parseDayOfMonth(day), undefined, `CUE-6: rejects day ${day}`);
}
for (const [raw, day] of [["12abc", 12], ["12.9", 12], ["1e1", 1], ["+2", 2]] as const) {
  assert.equal(parseDayOfMonth(raw), day, `CUE-6: preserves permissive day parsing (D-3) for ${raw}`);
}
for (const t of Object.values(dictionaries)) {
  const e = t.accounts.errors;
  const broken = { name: "", type: "", cutoffDay: "32", paymentDay: "0" };
  for (const [field, fixed, error] of [
    ["name", valid.name, e.nameRequired], ["type", valid.type, e.typeRequired],
    ["cutoffDay", valid.cutoffDay, e.invalidCutoffDay], ["paymentDay", valid.paymentDay, e.invalidPaymentDay],
  ] as const) {
    assert.deepEqual(validateAccount(broken, t), { error }, `CUE-6: ${field} precedes all later errors`);
    broken[field] = fixed;
  }
  assert.deepEqual(validateAccount(broken, t), { cutoffDayValue: 15, paymentDayValue: 31 }, "CUE-5/CUE-8: valid form returns parsed days");
  assert.deepEqual(validateAccount({ ...valid, cutoffDay: "", paymentDay: "" }, t), { cutoffDayValue: null, paymentDayValue: null }, "CUE-8/CUE-10: days are optional for all account types");
  for (const [field, error] of [
    ["name", e.nameRequired], ["type", e.typeRequired],
    ["cutoffDay", e.invalidCutoffDay], ["paymentDay", e.invalidPaymentDay],
  ] as const) {
    assert.deepEqual(accountFieldChanges(field, field.endsWith("Day") ? "32" : " ", t), { error }, `CUE-10: rejects invalid inline ${field}`);
  }
  for (const [field, raw, data] of [
    ["name", " Bank ", { name: "Bank" }], ["type", " Any type ", { type: "Any type" }],
    ["cutoffDay", " 12abc ", { cutoffDay: 12 }], ["paymentDay", " 31 ", { paymentDay: 31 }],
    ["cutoffDay", " ", { cutoffDay: null }], ["paymentDay", "", { paymentDay: null }],
  ] as const) {
    assert.deepEqual(accountFieldChanges(field, raw, t), { data }, `CUE-10: parses or clears inline ${field}`);
  }
  assert.deepEqual(accountFieldChanges("name", null as unknown as string, t), { error: e.nameRequired }, "CUE-10: non-string inline name is empty");
  assert.deepEqual(accountFieldChanges("type", null as unknown as string, t), { error: e.typeRequired }, "CUE-10: non-string inline type is empty");
  for (const field of ["cutoffDay", "paymentDay"] as const) {
    assert.deepEqual(accountFieldChanges(field, null as unknown as string, t), { data: { [field]: null } }, `CUE-10: non-string inline ${field} clears it`);
  }
  assert.equal(accountFieldChanges("unknown" as EditableAccountField, "x", t), undefined, "CUE-10: unknown inline field still produces no write");
}
console.log("account-validation ok");
