import { chromium } from "playwright";

const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:3001";
const BACKEND_BASE = process.env.BACKEND_BASE || "http://localhost:4000";

function uniqEmail() {
  const stamp = new Date().toISOString().replace(/[:.TZ-]/g, "");
  return `e2e.doctor.${stamp}@example.com`;
}

async function ensureAuthed(page, { email, password }) {
  await page.goto(`${FRONTEND_BASE}/auth/login`, { waitUntil: "domcontentloaded" });

  // If already authed, login page auto-redirects to /dashboard.
  const cookieBefore = await page.context().cookies(FRONTEND_BASE);
  const isAuthedCookie = cookieBefore.some((c) => c.name === "medai_auth" && c.value === "1");
  if (isAuthedCookie) return { email: "existing-session", password: "existing-session" };

  const emailInput = page.locator('input[type="email"]');
  const pwInput = page.locator('input[type="password"]');
  await emailInput.fill(email);
  await pwInput.fill(password);

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]).catch(async () => {
    // If login fails, register and continue.
    await page.goto(`${FRONTEND_BASE}/auth/register`, { waitUntil: "domcontentloaded" });
    await page.locator('input[placeholder="Dr. Nandakumar"]').fill("Dr. E2E");
    await page.locator('input[placeholder="Diabetology"]').fill("General Medicine");
    await page.locator('input[placeholder="doctor@medai.com"]').fill(email);
    await page.locator('input[placeholder="••••••••"]').first().fill(password);
    await page.locator('input[placeholder="••••••••"]').nth(1).fill(password);

    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
  });

  return { email, password };
}

async function openAssistant(page) {
  await page.goto(`${FRONTEND_BASE}/assistant`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "AI Doctor Assistant" }).waitFor({ timeout: 15_000 });
}

async function sendMessage(page, text) {
  const input = page.locator('input[placeholder^="Ask about patients"]');
  await input.fill(text);
  await page.getByRole("button", { name: /send/i }).click();

  // Wait until the user message appears in the thread.
  await page.getByText(text, { exact: true }).waitFor({ timeout: 15_000 });

  // Assistant reply may be async; wait briefly for typing indicator to settle.
  await page.waitForTimeout(1200);
}

async function clickNewChat(page) {
  const desktopNew = page.getByRole("button", { name: /^New$/ });
  const mobileNew = page.getByRole("button", { name: /New Chat/i });
  if (await desktopNew.isVisible().catch(() => false)) {
    await desktopNew.click();
    return;
  }
  await mobileNew.click();
}

async function switchPatientContext(page) {
  // Open select ("Context: ...") and choose first patient option (not "All Patients").
  await page.locator('button[role="combobox"]').click();
  const options = page.locator('[role="option"]');
  const optionCount = await options.count();
  if (optionCount < 2) throw new Error("No patient options found in context select");
  const firstPatient = options.nth(1);
  const label = await firstPatient.textContent();
  await firstPatient.click();
  return (label || "").trim();
}

async function getChatTitles(page) {
  // Desktop chat list: sidebar buttons with MessageSquare icon; easiest is to capture visible titles.
  const titleNodes = page.locator('p.truncate.text-sm.font-medium');
  const titles = [];
  const n = await titleNodes.count();
  for (let i = 0; i < n; i += 1) {
    const t = (await titleNodes.nth(i).textContent())?.trim();
    if (t) titles.push(t);
  }
  return titles;
}

async function activeThreadText(page) {
  // Capture visible message bubble text (best-effort; includes both user and assistant).
  const container = page.locator('div.flex-1.overflow-y-auto');
  return (await container.innerText()).trim();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(line);
    if (msg.type() === "error") consoleErrors.push(line);
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  const email = process.env.DOCTOR_EMAIL || uniqEmail();
  const password = process.env.DOCTOR_PASSWORD || "Passw0rd!234";

  const authed = await ensureAuthed(page, { email, password });
  const cookiesAfter = await context.cookies(FRONTEND_BASE);
  const medaiAuthCookie = cookiesAfter.find((c) => c.name === "medai_auth");

  await openAssistant(page);

  // Message flow in chat 1
  const msg1 = "E2E: hello assistant";
  const msg2 = "E2E: list critical patients";
  await sendMessage(page, msg1);
  await sendMessage(page, msg2);
  const thread1BeforeNewChat = await activeThreadText(page);

  // Create new chat + switch patient context + message
  await clickNewChat(page);
  const patientLabel = await switchPatientContext(page);
  const msg3 = `E2E: context switched to ${patientLabel || "patient"}. summarize meds.`;
  await sendMessage(page, msg3);
  const thread2BeforeRefresh = await activeThreadText(page);

  // Capture titles after 2 chats exist
  const titlesBeforeRefresh = await getChatTitles(page);

  // Refresh and confirm persistence
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "AI Doctor Assistant" }).waitFor({ timeout: 15_000 });
  const titlesAfterRefresh = await getChatTitles(page);
  const activeThreadAfterRefresh = await activeThreadText(page);

  // Switch back to first chat by clicking its title (best effort: first title that matches msg1 slice)
  const firstTitleGuess = msg1.slice(0, 50);
  const firstChatButton = page.getByRole("button", { name: new RegExp(firstTitleGuess.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
  if (await firstChatButton.isVisible().catch(() => false)) {
    await firstChatButton.click();
    await page.getByText(msg1, { exact: true }).waitFor({ timeout: 15_000 });
  } else {
    // Fallback: click first chat entry in list
    const firstEntry = page.locator('div.group:has(p.truncate.text-sm.font-medium)').first().locator("button").first();
    await firstEntry.click();
    await page.getByText(msg1, { exact: true }).waitFor({ timeout: 15_000 });
  }
  const thread1AfterSwitchBack = await activeThreadText(page);

  // Backend sync verification
  const actorId = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("medai_user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.id || u?.email || u?.name || null;
    } catch {
      return null;
    }
  });

  let backendSessions = null;
  let backendSessionsError = null;
  if (actorId) {
    try {
      const resp = await page.request.get(
        `${BACKEND_BASE}/api/chat/sessions?actorId=${encodeURIComponent(actorId)}`,
        { timeout: 15_000 }
      );
      backendSessions = await resp.json();
    } catch (e) {
      backendSessionsError = String(e);
    }
  }

  const report = {
    frontendBase: FRONTEND_BASE,
    backendBase: BACKEND_BASE,
    authedEmail: authed.email,
    actorId,
    medai_auth_cookie: medaiAuthCookie ? `${medaiAuthCookie.name}=${medaiAuthCookie.value}` : null,
    titlesBeforeRefresh,
    titlesAfterRefresh,
    // Evidence of persistence
    thread1ContainsMsg1BeforeNewChat: thread1BeforeNewChat.includes(msg1),
    thread2ContainsMsg3BeforeRefresh: thread2BeforeRefresh.includes(msg3),
    activeThreadAfterRefreshContainsMsg3: activeThreadAfterRefresh.includes(msg3),
    thread1AfterSwitchBackContainsMsg1: thread1AfterSwitchBack.includes(msg1),
    backendSessions,
    backendSessionsError,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    consoleErrors: consoleErrors.slice(0, 25),
    pageErrors: pageErrors.slice(0, 25),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

await main();

