// Run: npx tsx src/lib/password.check.ts
import { hashPassword, verifyPassword } from "./password";

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
async function main() {
  const password = "household password";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert(await verifyPassword(password, first.hash, first.salt), "RNF-2: hashed password roundtrips");
  assert(await verifyPassword(password, second.hash, second.salt), "RNF-2: independently salted password roundtrips");
  assert(!await verifyPassword("wrong password", first.hash, first.salt), "RF-6: incorrect password fails");
  assert(first.salt !== second.salt && first.hash !== second.hash, "RNF-2: equal passwords have different salted hashes");
  assert(first.hash !== password, "RNF-2: password is not stored as readable text");
  assert(!await verifyPassword(password, first.hash, second.salt), "RNF-2: a different salt cannot verify the hash");
  for (const hash of ["", "not hex", first.hash.slice(2), first.hash + "00"]) {
    assert(!await verifyPassword(password, hash, first.salt), "RNF-2: malformed or wrong-length stored hash fails safely");
  }
  console.log("password ok");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
