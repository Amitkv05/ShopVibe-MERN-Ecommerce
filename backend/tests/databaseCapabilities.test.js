import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTransactionMode, parseMongoHello, resolveTransactionPolicy } from "../config/databaseCapabilities.js";

test("detects standalone MongoDB and disables auto transactions", () => {
  const detected = parseMongoHello({ isWritablePrimary: true, logicalSessionTimeoutMinutes: 30 });
  assert.equal(detected.topology, "standalone");
  assert.equal(detected.transactionsSupported, false);
  const policy = resolveTransactionPolicy({ mode: "auto", transactionsSupported: false });
  assert.equal(policy.transactionsEnabled, false);
});

test("detects replica set and enables auto transactions", () => {
  const detected = parseMongoHello({ setName: "rs0", logicalSessionTimeoutMinutes: 30 });
  assert.equal(detected.topology, "replicaSet");
  assert.equal(detected.transactionsSupported, true);
  const policy = resolveTransactionPolicy({ mode: "auto", transactionsSupported: true });
  assert.equal(policy.transactionsEnabled, true);
});

test("detects mongos as transaction capable", () => {
  const detected = parseMongoHello({ msg: "isdbgrid", logicalSessionTimeoutMinutes: 30 });
  assert.equal(detected.topology, "mongos");
  assert.equal(detected.transactionsSupported, true);
});

test("strict transaction mode refuses standalone MongoDB", () => {
  assert.throws(
    () => resolveTransactionPolicy({ mode: "true", transactionsSupported: false }),
    /standalone/,
  );
});

test("explicit false disables transactions even when supported", () => {
  const policy = resolveTransactionPolicy({ mode: "false", transactionsSupported: true });
  assert.equal(policy.transactionsEnabled, false);
});

test("normalizes transaction mode aliases and rejects invalid values", () => {
  assert.equal(normalizeTransactionMode(undefined), "auto");
  assert.equal(normalizeTransactionMode("YES"), "true");
  assert.equal(normalizeTransactionMode("off"), "false");
  assert.throws(() => normalizeTransactionMode("sometimes"), /auto, true, or false/);
});
