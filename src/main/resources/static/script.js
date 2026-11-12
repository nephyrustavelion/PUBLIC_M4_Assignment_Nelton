"use strict";

// TaskFlow API test console. All steps run individually in the prescribed order.
const tasksToCreate = [
  {
    title: "Complete Module 4 assignment",
    description: "Finish and verify the TaskFlow API assignment",
    priority: "HIGH",
    dueDate: "2026-11-30",
    completed: false
  },
  {
    title: "Review DevSecOps pipeline",
    description: "Check GitHub Actions and security scanning",
    priority: "MEDIUM",
    dueDate: "2026-12-05",
    completed: false
  }
];

const state = { nextStep: 0, ids: [null, null], busy: false };
const baseUrl = document.getElementById("baseUrl");
const responseStatus = document.getElementById("responseStatus");
const responseMeta = document.getElementById("responseMeta");
const responseBody = document.getElementById("responseBody");
const progressText = document.getElementById("progressText");
const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");
const finishText = document.getElementById("finishText");

// When served by Spring Boot itself (8080 or Render), use same-origin requests.
if (window.location.protocol.startsWith("http") &&
  (window.location.port === "8080" || window.location.hostname.endsWith("onrender.com"))) {
  baseUrl.value = window.location.origin;
}

function apiUrl(path) {
  const raw = baseUrl.value.trim().replace(/\/+$/, "");
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Base URL must begin with http:// or https://");
  if (url.pathname !== "/" && url.pathname !== "") throw new Error("Enter the server base URL without /api/tasks");
  return `${url.origin}${path}`;
}

function button(step) { return document.querySelector(`[data-action="${step}"]`); }
function row(step) { return document.querySelector(`[data-step="${step}"]`); }
function result(step) { return document.getElementById(`stepResult${step}`); }

function setStatus(kind, label, details, payload) {
  responseStatus.className = `pill ${kind}`;
  responseStatus.textContent = label;
  responseMeta.textContent = details;
  responseBody.textContent = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}

function render() {
  progressText.textContent = `${state.nextStep} / 5 complete`;
  progressTrack.setAttribute("aria-valuenow", String(state.nextStep));
  progressFill.style.width = `${(state.nextStep / 5) * 100}%`;
  baseUrl.disabled = state.busy || state.nextStep > 0;
  document.querySelectorAll(".preset").forEach(btn => { btn.disabled = state.busy || state.nextStep > 0; });

  for (let i = 0; i < 5; i++) {
    const isDone = i < state.nextStep;
    const isCurrent = i === state.nextStep;
    row(i).classList.toggle("done", isDone);
    row(i).classList.toggle("current", isCurrent);
    button(i).disabled = state.busy || !isCurrent;
    button(i).textContent = isDone ? "Passed" : (state.busy && isCurrent ? "Running…" : `Run step ${i + 1}`);
  }
  finishText.textContent = state.nextStep === 5 ? "All five steps passed. The two created tasks have been deleted." : "Run the highlighted next step to continue.";
}

function extractId(payload) {
  // Spring Boot commonly returns { id: ... }; handle some envelope formats too.
  const value = payload?.id ?? payload?.task?.id ?? payload?.data?.id;
  if (typeof value === "number" || (typeof value === "string" && value.length > 0)) return value;
  throw new Error("POST returned no task ID. Expected JSON with an 'id' field.");
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content; // Spring Data pageable shape
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error("GET response did not contain a task array.");
}

async function callApi(method, path, requestBody) {
  const url = apiUrl(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      method,
      headers: requestBody ? { "Content-Type": "application/json", "Accept": "application/json" } : { "Accept": "application/json" },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: controller.signal
    });
    const ms = Math.round(performance.now() - started);
    const raw = await response.text();
    let payload = null;
    if (raw) {
      try { payload = JSON.parse(raw); } catch { payload = raw; }
    }
    return { response, payload, ms, url };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Request timed out after 90 seconds. Check whether your backend is running.");
    if (error instanceof TypeError) throw new Error("Network request failed. Check the API URL, whether the server is running, and browser CORS settings.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function execute(step) {
  if (state.busy || step !== state.nextStep) return;
  state.busy = true;
  row(step).classList.remove("failed");
  result(step).textContent = "Sending request…";
  setStatus("loading", "Requesting…", `Step ${step + 1} of 5`, "Waiting for API response…");
  render();

  let output;
  try {
    let method, path, requestBody;
    if (step === 0 || step === 1) {
      method = "POST"; path = "/api/tasks"; requestBody = tasksToCreate[step];
    } else if (step === 2) {
      method = "GET"; path = "/api/tasks";
    } else {
      method = "DELETE"; path = `/api/tasks/${encodeURIComponent(String(state.ids[step - 3]))}`;
    }
    output = await callApi(method, path, requestBody);
    const { response, payload, ms, url } = output;
    const allowed = step < 2 ? response.status === 201 : step === 2 ? response.status === 200 : [200, 202, 204].includes(response.status);
    setStatus(allowed ? "good" : "bad", `HTTP ${response.status}`, `${method} ${url} · ${ms} ms`, payload ?? (response.status === 204 ? "No response body (204 No Content)." : "(empty response)"));
    if (!allowed) throw new Error(`Unexpected HTTP ${response.status}. Expected ${step < 2 ? "201" : step === 2 ? "200" : "200, 202 or 204"}.`);

    let testDetail;
    if (step < 2) {
      state.ids[step] = extractId(payload);
      testDetail = `HTTP 201 · ${ms} ms · Saved ID ${state.ids[step]}`;
    } else if (step === 2) {
      const list = extractList(payload);
      const found = state.ids.every(id => list.some(task => String(task.id) === String(id)));
      if (!found) throw new Error(`The GET response does not contain both created IDs (${state.ids.join(", ")}).`);
      testDetail = `HTTP 200 · ${ms} ms · Both created tasks found (${list.length} listed)`;
    } else {
      testDetail = `HTTP ${response.status} · ${ms} ms · Deleted task ID ${state.ids[step - 3]}`;
    }
    result(step).textContent = `PASS — ${testDetail}`;
    state.nextStep += 1;
  } catch (error) {
    row(step).classList.add("failed");
    const message = error instanceof Error ? error.message : String(error);
    result(step).textContent = `FAILED — ${message}`;
    if (!output) setStatus("bad", "Request failed", `Step ${step + 1} of 5`, message);
    else if (output.response.ok) setStatus("bad", "Validation failed", `Step ${step + 1} of 5 · HTTP ${output.response.status}`, `${message}\n\nResponse:\n${JSON.stringify(output.payload, null, 2)}`);
  } finally {
    state.busy = false;
    render();
  }
}

document.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => execute(Number(btn.dataset.action))));
document.querySelectorAll(".preset").forEach(btn => btn.addEventListener("click", () => { if (state.nextStep === 0 && !state.busy) baseUrl.value = btn.dataset.url; }));
document.getElementById("resetButton").addEventListener("click", () => {
  if (state.busy) return;
  state.nextStep = 0;
  state.ids = [null, null];
  for (let i = 0; i < 5; i++) { row(i).classList.remove("done", "current", "failed"); result(i).textContent = i ? `Waiting for step ${i}` : "Ready to send request"; }
  setStatus("idle", "Not started", "No requests have been sent.", "The API response will appear here.");
  render();
});
render();
