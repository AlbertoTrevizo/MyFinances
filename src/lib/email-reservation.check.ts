import assert from "node:assert/strict";
import { withEmailSlot, type EmailReservation, type SendResult } from "./email-reservation";

async function check() {
  for (const reservation of ["limited", "failed", { id: "slot" }] satisfies EmailReservation[]) {
    for (const delivery of ["sent", "limited", "failed", "throw"] as const) {
      const calls: string[] = [];
      const operation = withEmailSlot(
        async () => { calls.push("reserve"); return reservation; },
        async (slot): Promise<SendResult> => {
          assert.deepEqual(slot, { id: "slot" });
          calls.push("rotate", "send");
          if (delivery === "throw") throw new Error("rotation failed");
          return delivery;
        },
        async (slot) => { assert.deepEqual(slot, { id: "slot" }); calls.push("release"); },
      );
      if (typeof reservation === "string") {
        assert.equal(await operation, reservation);
        assert.deepEqual(calls, ["reserve"], "S4: refused reservation never rotates or sends");
      } else {
        if (delivery === "throw") await assert.rejects(operation, /rotation failed/);
        else assert.equal(await operation, delivery);
        assert.deepEqual(calls, delivery === "sent" ? ["reserve", "rotate", "send"] : ["reserve", "rotate", "send", "release"], "S4: reserve before rotate; failures free the slot");
      }
    }
  }
  console.log("email-reservation ok");
}
void check();
