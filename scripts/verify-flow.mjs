/**
 * Walks the whole workflow end to end against a running server: the register
 * fills itself idempotently, an assessment lays out its checklist, a shortfall
 * raises an explained gap and a scheduled remediation action, evidence is
 * reviewed, a compliant reassessment parks the gap for verification, and only an
 * assessor's confirmation finally closes it.
 *
 * Run with the dev server up:  node scripts/verify-flow.mjs
 * Seed idempotency is also checked:  npm run db:seed  is executed twice.
 */
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let cookie = "";

const call = async (path, init = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), ...(cookie ? { cookie } : {}) },
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

  const body = await response.json().catch(() => null);
  return { status: response.status, body };
};

let failures = 0;

const check = (label, condition, detail = "") => {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const json = (method, path, body) =>
  call(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const signIn = async (email, password) => {
  cookie = "";
  return json("POST", "/api/auth/login", { email, password });
};

const main = async () => {
  // ---------------------------------------------------------------- seeding
  console.log("\n— Reference data —");

  const seed = () =>
    execFileSync("npm", ["run", "db:seed"], { encoding: "utf8", shell: true });

  seed();
  const secondSeed = seed();
  check(
    "Seed is idempotent: a second run reports the same catalogue",
    /93 controls/.test(secondSeed),
    secondSeed.trim().split("\n").at(-1),
  );

  const login = await signIn("assessor@nrlhd.health.nsw.gov.au", "Assessor12345");
  check("Sign in as assessor", login.status === 200, `status ${login.status}`);
  const assessorId = login.body?.data?.id;

  const frameworks = await call("/api/frameworks");
  const framework = frameworks.body?.data?.[0];
  check("Framework is seeded", framework?.code === "ISO27001-2022", framework?.code);

  const catalogue = await call(`/api/frameworks/${framework.code}`);
  const themes = catalogue.body?.data?.themes ?? [];
  check(
    "Annex A is grouped into the four official themes",
    themes.length === 4 && themes.map((t) => t.code).join(",") === "A.5,A.6,A.7,A.8",
    themes.map((t) => `${t.code}:${t.controlCount}`).join(" "),
  );
  check(
    "Catalogue holds 93 controls",
    themes.reduce((sum, t) => sum + t.controlCount, 0) === 93,
  );

  // --------------------------------------------------------------- register
  console.log("\n— Control register —");

  const sync = await json("POST", "/api/register/sync", {});
  check("Register synchronises from the catalogue", sync.status === 200);

  const register = await call("/api/register?pageSize=1");
  check(
    "Register holds all 93 catalogue controls",
    register.body?.data?.total === 93,
    `total ${register.body?.data?.total}`,
  );

  // Record a decision, re-sync, and prove the decision survived.
  const owned = await call("/api/register?pageSize=1&search=A.5.1");
  const entry = owned.body?.data?.items?.[0];
  await json("PATCH", `/api/register/${entry.id}`, {
    implementationStatus: "PARTIALLY_IMPLEMENTED",
    implementationNotes: "Policy drafted, awaiting executive approval.",
  });

  const resync = await json("POST", "/api/register/sync", {});
  const afterResync = await call("/api/register?pageSize=1&search=A.5.1");
  check(
    "Re-syncing adds nothing and preserves existing decisions",
    resync.body?.data?.added === 0 &&
      afterResync.body?.data?.items?.[0]?.implementationStatus === "PARTIALLY_IMPLEMENTED",
    `added ${resync.body?.data?.added}`,
  );

  // Start from a known state so the rule is tested, not a leftover justification.
  await json("PATCH", `/api/register/${entry.id}`, {
    applicability: "APPLICABLE",
    justification: null,
  });

  const naWithout = await json("PATCH", `/api/register/${entry.id}`, {
    applicability: "NOT_APPLICABLE",
  });
  check(
    "Not applicable without a justification is refused by the API",
    naWithout.status === 422,
    `status ${naWithout.status}`,
  );

  const naWith = await json("PATCH", `/api/register/${entry.id}`, {
    applicability: "NOT_APPLICABLE",
    justification: "The district has no in-house software development.",
  });
  check("Not applicable with a justification is accepted", naWith.status === 200);

  // Put the control back in scope so the assessment covers all 93.
  await json("PATCH", `/api/register/${entry.id}`, {
    applicability: "APPLICABLE",
    implementationStatus: "PARTIALLY_IMPLEMENTED",
  });

  // ------------------------------------------------------------- assessment
  console.log("\n— Assessment —");

  const created = await json("POST", "/api/assessments", {
    title: `Automated verification ${Date.now()}`,
    scope: "Verification run covering all applicable controls across the district.",
    frameworkCode: framework.code,
    leadAssessorId: assessorId,
  });
  check("Assessment starts", created.status === 201, `status ${created.status}`);

  const assessmentId = created.body?.data?.id;
  check(
    "Checklist is generated for every applicable control",
    created.body?.data?.progress?.total === 93,
    `${created.body?.data?.progress?.total} items`,
  );

  const items = await call(`/api/assessments/${assessmentId}/items?search=A.8.24`);
  const cryptoItem = items.body?.data?.items?.[0];
  check("Assessment item found", Boolean(cryptoItem), cryptoItem?.controlCode);

  // ------------------------------------------------------------------ gaps
  console.log("\n— Automatic gap identification —");

  const finding = await json("PATCH", `/api/assessment-items/${cryptoItem.id}`, {
    status: "NON_COMPLIANT",
    currentPractice: "No cryptographic policy exists and patient data is stored unencrypted.",
  });
  check("Finding recorded", finding.status === 200, `status ${finding.status}`);
  check(
    "Gap raised automatically by the finding",
    Boolean(finding.body?.data?.gapReference),
    finding.body?.data?.gapReference,
  );

  const gaps = await call(`/api/gaps?assessmentId=${assessmentId}&outstandingOnly=true`);
  const gapSummary = gaps.body?.data?.items?.find((g) => g.controlCode === cryptoItem.controlCode);
  check("Gap appears in the register", Boolean(gapSummary), gapSummary?.reference);

  const gapId = gapSummary.id;
  const gapDetail = await call(`/api/gaps/${gapId}`);
  const gap = gapDetail.body?.data;

  check("Gap opens in the OPEN state", gap?.status === "OPEN", gap?.status);
  check(
    "Gap description is generated as an editable draft",
    gap?.description === gap?.generatedDescription && gap?.descriptionEditedAt === null,
  );

  // ------------------------------------------------------- explainable risk
  console.log("\n— Explainable risk score —");

  const factorCodes = (gap?.riskFactors ?? []).map((f) => f.code).sort();
  check(
    "Risk score is stored with the gap",
    typeof gap?.riskScore === "number" && gap.riskScore > 0 && gap.riskMaximumScore === 12,
    `${gap?.riskScore}/${gap?.riskMaximumScore}`,
  );
  check(
    "All four scoring factors are recorded",
    factorCodes.join(",") === "controlImportance,implementation,objectiveImpact,severity",
    factorCodes.join(", "),
  );
  check(
    "Every factor carries points and a plain-language reason",
    (gap?.riskFactors ?? []).every(
      (f) => typeof f.points === "number" && typeof f.maximum === "number" && Boolean(f.detail),
    ),
  );
  check(
    "Factor points add up to the stored score",
    (gap?.riskFactors ?? []).reduce((sum, f) => sum + f.points, 0) === gap?.riskScore,
  );
  check(
    "Rating matches the documented band",
    gap?.riskRating ===
      (gap.riskScore >= 11 ? "CRITICAL" : gap.riskScore >= 9 ? "HIGH" : gap.riskScore >= 6 ? "MEDIUM" : "LOW"),
    `${gap?.riskRating} at ${gap?.riskScore}`,
  );
  check("Risk model version is recorded", Boolean(gap?.riskModelVersion), gap?.riskModelVersion);

  // ------------------------------------------------------------ remediation
  console.log("\n— Remediation planning —");

  const SLA_DAYS = { CRITICAL: 14, HIGH: 30, MEDIUM: 60, LOW: 90 };
  const actions = await call(`/api/remediation?gapId=${gapId}`);
  const action = actions.body?.data?.items?.[0];
  check("Remediation action scheduled automatically", Boolean(action), action?.reference);
  check("Priority derives from the risk", action?.priority === gap.riskRating, action?.priority);

  const daysOut = Math.round(
    (new Date(action.dueAt) - new Date(action.createdAt)) / (1000 * 60 * 60 * 24),
  );
  check(
    "Due date applies the internal remediation SLA",
    daysOut === SLA_DAYS[gap.riskRating],
    `${daysOut} days for ${gap.riskRating} (SLA ${SLA_DAYS[gap.riskRating]})`,
  );

  const partial = await call(`/api/assessments/${assessmentId}/items?search=A.5.7`);
  const partialItem = partial.body?.data?.items?.[0];
  await json("PATCH", `/api/assessment-items/${partialItem.id}`, {
    status: "PARTIALLY_COMPLIANT",
    currentPractice: "Threat bulletins are read ad hoc but nothing is documented or acted on.",
  });

  const afterPartial = await call(`/api/gaps?assessmentId=${assessmentId}&outstandingOnly=true`);
  check(
    "Partial compliance also raises a gap",
    afterPartial.body?.data?.total === 2,
    `${afterPartial.body?.data?.total} outstanding in this assessment`,
  );

  // ------------------------------------------------- editable gap narrative
  console.log("\n— Assessor owns the wording —");

  const confirmed = "Patient data at rest is unencrypted across the district's shared file servers, and no approved cryptographic policy exists to govern key handling.";
  const edited = await json("PATCH", `/api/gaps/${gapId}`, { description: confirmed });
  check("Assessor can edit the generated description", edited.status === 200);
  check(
    "The confirmed description is stored separately from the draft",
    edited.body?.data?.description === confirmed &&
      edited.body?.data?.generatedDescription === gap.generatedDescription &&
      Boolean(edited.body?.data?.descriptionEditedAt),
  );

  // ---------------------------------------------------------------- closure
  console.log("\n— Closure requires verification —");

  const tooEarly = await json("PATCH", `/api/gaps/${gapId}`, { status: "RESOLVED" });
  check(
    "A gap cannot jump from Open straight to Resolved",
    tooEarly.status === 409,
    tooEarly.body?.error?.message,
  );

  const fixed = await json("PATCH", `/api/assessment-items/${cryptoItem.id}`, {
    status: "COMPLIANT",
    currentPractice: "Cryptographic policy approved and full disk encryption rolled out.",
  });
  check("Control reassessed as compliant", fixed.status === 200);

  const parked = await call(`/api/gaps/${gapId}`);
  check(
    "Reassessment parks the gap for review instead of closing it",
    parked.body?.data?.status === "AWAITING_REVIEW",
    parked.body?.data?.status,
  );

  const inReview = await call(`/api/remediation?gapId=${gapId}`);
  check(
    "Its action moves to review rather than vanishing",
    inReview.body?.data?.items?.[0]?.status === "IN_REVIEW",
    inReview.body?.data?.items?.[0]?.status,
  );

  // --------------------------------------------------------------- evidence
  console.log("\n— Evidence review —");

  // The upload endpoint takes multipart form data so a document and its
  // metadata arrive together; a link simply omits the file part.
  const form = new FormData();
  form.set("title", "Encryption rollout completion report");
  form.set("kind", "LINK");
  form.set("url", "https://intranet.example.org/isms/encryption-rollout");
  form.set("remediationId", action.id);

  const evidence = await call("/api/evidence", { method: "POST", body: form });
  check(
    "Evidence attached to the remediation action",
    evidence.status === 201,
    evidence.body?.error?.message,
  );
  const evidenceId = evidence.body?.data?.id;
  check(
    "New evidence starts as pending review",
    evidence.body?.data?.reviewStatus === "PENDING",
    evidence.body?.data?.reviewStatus,
  );

  const earlyComplete = await json("PATCH", `/api/remediation/${action.id}`, {
    status: "COMPLETED",
  });
  check(
    "Unreviewed evidence blocks completing the remediation action",
    earlyComplete.status === 409,
    earlyComplete.body?.error?.message,
  );

  const blockedByEvidence = await json("PATCH", `/api/gaps/${gapId}`, { status: "RESOLVED" });
  check(
    "Pending evidence blocks gap closure",
    blockedByEvidence.status === 409,
    blockedByEvidence.body?.error?.message,
  );

  const rejectNoReason = await json("PATCH", `/api/evidence/${evidenceId}`, {
    reviewStatus: "REJECTED",
  });
  check(
    "Rejecting evidence without a reason is refused",
    rejectNoReason.status === 422,
    `status ${rejectNoReason.status}`,
  );

  const rejected = await json("PATCH", `/api/evidence/${evidenceId}`, {
    reviewStatus: "REJECTED",
    reviewNote: "The report covers two hospitals only; the district-wide rollout is not evidenced.",
  });
  check("Rejecting evidence with a reason is accepted", rejected.status === 200);

  const accepted = await json("PATCH", `/api/evidence/${evidenceId}`, {
    reviewStatus: "ACCEPTED",
    reviewNote: "Updated report covers all five sites.",
  });
  check("Evidence can be accepted after rework", accepted.body?.data?.reviewStatus === "ACCEPTED");

  const openAction = await json("PATCH", `/api/gaps/${gapId}`, { status: "RESOLVED" });
  check(
    "An open remediation action still blocks closure",
    openAction.status === 409,
    openAction.body?.error?.message,
  );

  const completed = await json("PATCH", `/api/remediation/${action.id}`, { status: "COMPLETED" });
  check(
    "Action can be completed once its evidence has been reviewed",
    completed.status === 200 && completed.body?.data?.status === "COMPLETED",
    completed.body?.data?.status ?? completed.body?.error?.message,
  );

  const closed = await json("PATCH", `/api/gaps/${gapId}`, { status: "RESOLVED" });
  check(
    "Assessor confirmation finally closes the gap",
    closed.status === 200 && closed.body?.data?.status === "RESOLVED",
    closed.body?.data?.status ?? closed.body?.error?.message,
  );
  check(
    "Closure records who verified it and when",
    Boolean(closed.body?.data?.verifiedByName) && Boolean(closed.body?.data?.verifiedAt),
    closed.body?.data?.verifiedByName,
  );

  // ----------------------------------------------------------- authorisation
  console.log("\n— Authorisation —");

  const viewer = await signIn("viewer@nrlhd.health.nsw.gov.au", "Viewer1234567");
  check("Sign in as viewer", viewer.status === 200);

  const forbidden = await json("PATCH", `/api/gaps/${gapId}`, { status: "IN_PROGRESS" });
  check(
    "A viewer cannot change a gap even by calling the API directly",
    forbidden.status === 403,
    `status ${forbidden.status}`,
  );

  await signIn("assessor@nrlhd.health.nsw.gov.au", "Assessor12345");

  // --------------------------------------------------- compliance & reports
  console.log("\n— Compliance, reports and audit —");

  const overview = await call(`/api/assessments/${assessmentId}/items?pageSize=1`);
  check("Assessment items remain readable", overview.status === 200);

  const assessments = await call("/api/assessments?pageSize=5");
  const current = assessments.body?.data?.items?.find((a) => a.id === assessmentId);
  const byStatus = current?.progress?.byStatus ?? {};
  const inScope =
    (byStatus.COMPLIANT ?? 0) + (byStatus.PARTIALLY_COMPLIANT ?? 0) + (byStatus.NON_COMPLIANT ?? 0);
  const expected =
    inScope === 0
      ? 0
      : Math.round((((byStatus.COMPLIANT ?? 0) + (byStatus.PARTIALLY_COMPLIANT ?? 0) * 0.5) / inScope) * 100);

  check(
    "Compliance uses the documented formula and excludes Not applicable",
    current?.progress?.compliancePercent === expected,
    `${current?.progress?.compliancePercent}% expected ${expected}%`,
  );

  const reports = await Promise.all(
    ["statement-of-applicability", "gap-register", "remediation-plan"].map(async (kind) => {
      const response = await fetch(`${BASE}/api/reports/${kind}`, { headers: { cookie } });
      return { kind, status: response.status, text: await response.text() };
    }),
  );

  for (const report of reports) {
    check(`${report.kind} exports`, report.status === 200 && report.text.length > 0);
  }

  const gapReport = reports.find((r) => r.kind === "gap-register");
  check(
    "Gap register export carries the stored risk score and its basis",
    gapReport.text.includes("Risk score") &&
      gapReport.text.includes("Risk basis") &&
      gapReport.text.includes(`${gap.riskScore}/${gap.riskMaximumScore}`),
  );
  check(
    "Gap register export reflects the assessor's confirmed description",
    gapReport.text.includes("shared file servers"),
  );

  const audit = await call("/api/audit?pageSize=100");
  const summaries = (audit.body?.data?.items ?? []).map((entry) => entry.summary).join("\n");
  const logged = {
    "gap creation": /identified for A\.8\.24/.test(summaries),
    "risk recalculation": /risk|Risk/.test(summaries),
    "remediation SLA": /remediation SLA/.test(summaries),
    "evidence review": /Evidence .* (accepted|rejected)/.test(summaries),
    "awaiting review transition": /AWAITING_REVIEW/.test(summaries),
    "gap closure": /verified and closed/.test(summaries),
  };

  for (const [what, present] of Object.entries(logged)) {
    check(`Audit log records ${what}`, present);
  }

  const auditWrite = await json("POST", "/api/audit", { summary: "tampering" });
  check(
    "The audit log has no write endpoint",
    auditWrite.status === 404 || auditWrite.status === 405,
    `status ${auditWrite.status}`,
  );

  console.log(
    `\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`,
  );
  if (failures > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
