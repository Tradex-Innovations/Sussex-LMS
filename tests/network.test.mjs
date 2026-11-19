import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState } from "../dist/data.js";
import { contextFor } from "../dist/access.js";
import { networkBranches } from "../dist/network.js";
import { assessmentResult, branchActivity, networkSummary, rankedResults } from "../dist/network-analytics.js";

const assessment = { subject: "mathematics", grade: 8, term: 3 };

test("The directory contains the 20 official schools with map positions and official source links", () => {
  const state = freshState();
  assert.equal(state.branches.length, 20);
  assert.equal(new Set(state.branches.map((branch) => branch.name)).size, 20);
  for (const branch of state.branches) {
    assert.ok(branch.lat > 5.8 && branch.lat < 9);
    assert.ok(branch.lon > 79.5 && branch.lon < 82);
    assert.ok(branch.address);
    assert.match(branch.source, /^https:\/\/www\.sussexcollege\.lk\/branch_network\//);
  }
  assert.equal(state.branches.find((branch) => branch.id === "colombo").name, "Nugegoda");
  assert.equal(state.branches.find((branch) => branch.id === "lakeside").name, "Malabe");
  assert.ok(state.branches.find((branch) => branch.slug === "matara").lat < 6);
});

test("School comparisons stay within the current role and selected branches", () => {
  const state = freshState();
  const chairman = contextFor(state, "chairman");
  assert.equal(networkBranches(state, chairman, { compare: null }).length, 20);
  assert.equal(networkBranches(state, chairman, { compare: [] }).length, 0);
  assert.deepEqual(networkBranches(state, chairman, { compare: ["kandy", "galle"] }).map((branch) => branch.id).sort(), ["galle", "kandy"]);
  const principal = contextFor(state, "principal", "principal_c");
  assert.deepEqual(networkBranches(state, principal, { compare: ["kandy"] }).map((branch) => branch.id), ["colombo"]);
});

test("Ranking uses descending averages for the same grade, subject and term", () => {
  const state = freshState();
  const results = rankedResults(state.branches, assessment);
  assert.equal(results.length, 20);
  assert.equal(results[0].rank, 1);
  assert.ok(results.every((result, index) => index === 0 || results[index - 1].mean >= result.mean));
  assert.ok(results.every((result) => result.mean >= 0 && result.mean <= 100 && result.passRate >= 0 && result.passRate <= 100));
  assert.notDeepEqual(results.map((result) => result.mean), rankedResults(state.branches, { ...assessment, subject: "science" }).map((result) => result.mean));
  assert.ok(rankedResults(state.branches, { ...assessment, term: 1 }).every((result) => result.change === null));
});

test("Network totals weight all sample marks and passed students", () => {
  const state = freshState();
  const results = rankedResults(state.branches.slice(0, 3), assessment);
  const marks = results.flatMap((result) => result.marks);
  const summary = networkSummary(results);
  assert.equal(summary.count, marks.length);
  assert.equal(summary.mean, Math.round(marks.reduce((sum, mark) => sum + mark, 0) / marks.length * 10) / 10);
  assert.equal(summary.passRate, Math.round(marks.filter((mark) => mark >= 50).length / marks.length * 1000) / 10);
  assert.deepEqual(networkSummary([]), { count: 0, mean: 0, passRate: 0 });
  const branch = state.branches[0];
  assert.ok(assessmentResult(branch, assessment).mean > assessmentResult(branch, { ...assessment, term: 1 }).mean);
});

test("A saved two-branch prototype expands to the directory while keeping operational records", () => {
  const old = freshState();
  delete old.networkVersion;
  old.branches = [{ id: "colombo", name: "Colombo", school: "Sussex College Colombo" }, { id: "lakeside", name: "Lakeside", school: "Sussex College Lakeside" }];
  old.completed.amaya = ["m1", "m2"];
  old.orders.push({ number: "CW-1001", branch: "colombo", parent: "parent", items: [] });
  globalThis.localStorage = { getItem: () => JSON.stringify(old) };
  const state = loadState();
  assert.equal(state.branches.length, 20);
  assert.equal(state.branches.find((branch) => branch.id === "colombo").name, "Nugegoda");
  assert.deepEqual(state.accounts, old.accounts);
  assert.deepEqual(state.completed, old.completed);
  assert.deepEqual(state.orders, old.orders);
  assert.equal(state.students[0].admissionNumber, "SCN-1001");
});

test("Activity includes demo updates only for the selected branch and category", () => {
  const state = freshState();
  state.activity = [
    { id: "new", branch: "colombo", category: "academic", message: "New course notes", at: "2026-11-20T12:00:00Z" },
    { id: "other", branch: "lakeside", category: "academic", message: "Other school", at: "2026-11-20T12:00:00Z" },
  ];
  const feed = branchActivity(state, "colombo", "academic");
  assert.equal(feed[0].id, "new");
  assert.ok(feed.every((entry) => entry.branch === "colombo" && entry.category === "academic"));
  assert.ok(feed.some((entry) => entry.sample));
});
