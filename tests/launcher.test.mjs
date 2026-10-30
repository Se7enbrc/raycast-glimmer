import assert from "node:assert/strict";
import { test } from "node:test";
import { launcherApps } from "../src/lib/contract.ts";
import { loadSource } from "./helpers/load-source.mjs";

test("the launcher hides hidden apps except the running app, without changing source order", () => {
  const apps = [
    { id: 1, hidden: false, running: false },
    { id: 2, hidden: true, running: false },
    { id: 3, hidden: true, running: true },
    { id: 4, hidden: false, running: false },
  ];
  assert.deepEqual(
    launcherApps(apps, false).map((app) => app.id),
    [3, 1, 4],
  );
  assert.deepEqual(
    launcherApps(apps, true).map((app) => app.id),
    [3, 1, 2, 4],
  );
  assert.deepEqual(
    apps.map((app) => app.id),
    [1, 2, 3, 4],
  );
});

function setup({ wake = async () => {}, open = async () => {} } = {}) {
  const events = [];
  const toast = {};
  const { wakeWithToast } = loadSource("../src/components/shared.tsx", {
    "@raycast/api": {
      Toast: { Style: { Animated: "working", Success: "success", Failure: "failure" } },
      showToast: async (options) => Object.assign(toast, options),
      open: async (url) => {
        events.push(url);
        await open();
      },
    },
    "../lib/contract": {},
    "../lib/glimmer": {
      wakePC: async (pc) => {
        events.push(`wake:${pc.id}`);
        await wake();
      },
      errorMessage: (error) => error.message,
    },
  });
  const pc = { id: "pc-id", name: "Den PC" };
  return { wakeWithToast, pc, toast, events, refresh: async () => events.push("refresh") };
}

test("wake and stream waits for the PC and suppresses duplicate wake requests", async () => {
  let finishWake;
  const waiting = new Promise((resolve) => {
    finishWake = resolve;
  });
  const h = setup({ wake: () => waiting });
  const url = "glimmer://stream?pc=pc-id&app=Steam";
  const pending = h.wakeWithToast(h.pc, h.refresh, url);
  await Promise.resolve();
  await h.wakeWithToast(h.pc, h.refresh, url);
  assert.deepEqual(h.events, ["wake:pc-id"]);
  finishWake();
  await pending;
  assert.deepEqual(h.events, ["wake:pc-id", url, "refresh"]);
  assert.equal(h.toast.title, "Stream requested");
  assert.equal(h.toast.style, "success");
});

test("a failed wake never requests a stream and permits retry", async () => {
  const h = setup({
    wake: async () => {
      throw new Error("PC did not answer");
    },
  });
  for (let attempt = 0; attempt < 2; attempt++) await h.wakeWithToast(h.pc, h.refresh, "glimmer://stream?pc=pc-id");
  assert.deepEqual(h.events, ["wake:pc-id", "wake:pc-id"]);
  assert.equal(h.toast.style, "failure");
  assert.equal(h.toast.title, "Couldn’t wake Den PC");
});

test("a failed launch reports that wake succeeded, without claiming playback", async () => {
  const h = setup({
    open: async () => {
      throw new Error("Private URL details");
    },
  });
  await h.wakeWithToast(h.pc, h.refresh, "glimmer://stream?pc=pc-id");
  assert.equal(h.toast.style, "failure");
  assert.equal(h.toast.title, "PC awake, but couldn’t open Glimmer");
  assert.doesNotMatch(h.toast.message, /Private/);
  assert.equal(h.events.at(-1), "refresh");
});

test("wake-only never opens a stream", async () => {
  const h = setup();
  await h.wakeWithToast(h.pc, h.refresh);
  assert.deepEqual(h.events, ["wake:pc-id", "refresh"]);
  assert.equal(h.toast.title, "Den PC is awake");
});
