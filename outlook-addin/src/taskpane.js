const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";
const REMOTE_BACKEND_URL = "https://moshewiesenberg--dappledoc-agent-api.modal.run";
const BACKEND_OVERRIDE = localStorage.getItem("DAPPLEDOC_BACKEND_URL");
const OFFICE_AVAILABLE = typeof Office !== "undefined" && typeof Office.onReady === "function";

let planRows = [];
let outreachQueue = [];
let inboxQueue = [];
let currentQueue = [];
let currentIndex = 0;
let currentMode = "outreach";
let demoEmailContext = null;
let backendUrl = BACKEND_OVERRIDE;

async function boot() {
    backendUrl = await resolveBackendUrl();
    bindEvents();
    bindBrowserDemoBridge();
    await checkBackendStatus();
    await fetchPlan();
}

if (OFFICE_AVAILABLE) {
    Office.onReady(() => boot());
} else {
    window.addEventListener("DOMContentLoaded", boot);
}

function bindEvents() {
    document.getElementById("btn-scan-plan").addEventListener("click", runScan);
    document.getElementById("btn-review-outreach").addEventListener("click", () => openPreview("outreach"));
    document.getElementById("btn-send-all-outreach").addEventListener("click", () => handleSendAll("outreach"));
    document.getElementById("btn-check-inbox").addEventListener("click", checkInbox);
    document.getElementById("btn-review-inbox").addEventListener("click", () => openPreview("inbox"));
    document.getElementById("btn-close-modal").addEventListener("click", closePreview);
    document.getElementById("btn-back-to-list").addEventListener("click", showListView);
    document.getElementById("btn-send-all-modal").addEventListener("click", sendAll);
    document.getElementById("btn-send-individual").addEventListener("click", sendIndividual);
    document.getElementById("btn-chain").addEventListener("click", runMvpFlow);

    document.getElementById("preview-subject").addEventListener("input", (event) => {
        if (currentQueue[currentIndex]) currentQueue[currentIndex].subject = event.target.value;
    });
    document.getElementById("preview-body").addEventListener("input", (event) => {
        if (currentQueue[currentIndex]) currentQueue[currentIndex].body = event.target.value;
    });
}

function bindBrowserDemoBridge() {
    window.addEventListener("message", (event) => {
        if (!event.data || event.data.type !== "EMAIL_SELECTED") return;
        const email = event.data.email;
        demoEmailContext = {
            fromName: email.from,
            fromEmail: email.email,
            subject: email.subject,
            body: email.body
        };

        const log = document.getElementById("inbox-output");
        log.innerHTML = "";
        addLog(log, `Selected demo email from ${email.from}.`, "info");
        addLog(log, "Click Draft Reply to generate a response.", "info");
    });
}

async function checkBackendStatus() {
    const statusEl = document.getElementById("backend-status");
    const tooltipEl = statusEl.querySelector(".tooltiptext");

    try {
        const response = await fetch(`${backendUrl}/status`);
        if (!response.ok) throw new Error("offline");
        const data = await response.json();
        statusEl.classList.add("online");
        statusEl.classList.remove("offline");
        const modeLabel = data.llmConfigured ? `${data.mode} + llm` : data.mode;
        const backendLabel = backendUrl === LOCAL_BACKEND_URL ? "local demo" : "remote";
        tooltipEl.innerText = `Backend: Online (${backendLabel}, ${modeLabel})`;
    } catch (error) {
        statusEl.classList.add("offline");
        statusEl.classList.remove("online");
        tooltipEl.innerText = "Backend: Offline";
    }
}

async function fetchPlan() {
    const container = document.getElementById("plan-table-container");
    container.innerHTML = "<p>Loading plan...</p>";

    try {
        const response = await fetch(`${backendUrl}/get_plan`);
        if (!response.ok) throw new Error("Failed to load plan");
        const data = await response.json();
        planRows = data.rows || [];
        renderPlan();
    } catch (error) {
        container.innerHTML = "<p>Could not load plan from backend.</p>";
    }
}

function renderPlan() {
    const container = document.getElementById("plan-table-container");
    if (!planRows.length) {
        container.innerHTML = "<p>No plan rows found.</p>";
        return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">';
    html += '<tr style="text-align: left; border-bottom: 1px solid var(--border); color: var(--text-secondary);"><th>Outlet</th><th>Status</th></tr>';

    planRows.forEach((row) => {
        const status = row.Status || "Unknown";
        const badgeClass = status === "Sent" ? "status-done" : "status-pending";
        html += `<tr style="border-bottom: 1px solid var(--border); height: 2.5rem;">
            <td>${escapeHtml(row.Outlet || "")}</td>
            <td><span class="status-badge ${badgeClass}">${escapeHtml(status)}</span></td>
        </tr>`;
    });

    html += "</table>";
    container.innerHTML = html;
}

async function runScan() {
    const log = document.getElementById("outreach-output");
    log.innerHTML = "";
    addLog(log, "Reading PR plan and generating review queue...", "info");

    try {
        const response = await fetch(`${backendUrl}/generate_outreach_queue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        if (!response.ok) throw new Error("Queue generation failed");

        const data = await response.json();
        outreachQueue = (data.queue || []).map((item) => ({
            to: item.email,
            displayTo: `${item.journalist} <${item.email}>`,
            subject: item.subject,
            body: item.body,
            outlet: item.outlet,
            journalist: item.journalist,
            sourceStatus: item.status,
            generationMode: item.generationMode,
            type: "Draft"
        }));

        addLog(log, `Loaded ${outreachQueue.length} draft(s) from the PR plan.`, "success");
        outreachQueue.forEach((item) => {
            addLog(log, `${item.journalist} at ${item.outlet} (${item.generationMode})`, "info");
        });

        document.getElementById("btn-review-outreach").disabled = outreachQueue.length === 0;
        document.getElementById("btn-send-all-outreach").disabled = outreachQueue.length === 0;
    } catch (error) {
        addLog(log, error.message, "error");
    }
}

async function checkInbox() {
    const log = document.getElementById("inbox-output");
    log.innerHTML = "";
    inboxQueue = [];
    document.getElementById("btn-review-inbox").disabled = true;

    const liveItem = getLiveMailboxItem();
    const context = liveItem
        ? await extractOfficeEmail(liveItem)
        : demoEmailContext;

    if (!context) {
        addLog(log, OFFICE_AVAILABLE
            ? "Open an email in Outlook first, then click Draft Reply."
            : "Select an email in the browser demo first, then click Draft Reply.", "info");
        return;
    }

    addLog(log, `Reading "${context.subject}"...`, "info");

    try {
        const response = await fetch(`${backendUrl}/analyze_email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject: context.subject, body: context.body })
        });
        if (!response.ok) throw new Error("Reply drafting failed");

        const data = await response.json();
        inboxQueue = [{
            to: context.fromEmail,
            displayTo: `${context.fromName} <${context.fromEmail}>`,
            subject: `RE: ${context.subject}`,
            body: data.draft || "No draft returned.",
            outlet: "Inbox",
            journalist: context.fromName,
            type: "Reply"
        }];

        addLog(log, "Draft reply ready for review.", "success");
        document.getElementById("btn-review-inbox").disabled = false;
    } catch (error) {
        addLog(log, error.message, "error");
    }
}

async function runMvpFlow() {
    const button = document.getElementById("btn-chain");
    const original = button.innerText;
    button.innerText = "Running...";
    button.disabled = true;

    await runScan();
    if (outreachQueue.length) {
        openPreview("outreach");
    }

    button.innerText = original;
    button.disabled = false;
}

function openPreview(mode) {
    currentMode = mode;
    currentQueue = mode === "outreach" ? [...outreachQueue] : [...inboxQueue];

    if (!currentQueue.length) {
        const logId = mode === "outreach" ? "outreach-output" : "inbox-output";
        addLog(document.getElementById(logId), "Nothing to review yet.", "info");
        return;
    }

    document.getElementById("modal-title").innerText = mode === "outreach" ? "Review Outreach Drafts" : "Review Reply Draft";
    document.getElementById("preview-modal").classList.add("active");
    showListView();
}

function showListView() {
    document.getElementById("preview-list-container").style.display = "block";
    document.getElementById("preview-detail-container").style.display = "none";
    document.getElementById("modal-actions-list").style.display = "flex";
    document.getElementById("modal-actions-detail").style.display = "none";
    document.getElementById("btn-back-to-list").style.display = "none";
    document.getElementById("preview-counter").innerText = `${currentQueue.length} pending`;

    const listContainer = document.getElementById("recipient-list");
    listContainer.innerHTML = "";

    currentQueue.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "recipient-item";
        div.innerHTML = `
            <div class="recipient-item-info">
                <span class="recipient-name">${escapeHtml(item.journalist || item.to)}</span>
                <span class="recipient-detail">${escapeHtml(item.outlet || "")}</span>
            </div>
            <span class="recipient-status">${escapeHtml(item.type)}</span>
        `;
        div.addEventListener("click", () => showDetailView(index));
        listContainer.appendChild(div);
    });
}

function showDetailView(index) {
    currentIndex = index;
    const item = currentQueue[index];

    document.getElementById("preview-to").value = item.displayTo || item.to;
    document.getElementById("preview-subject").value = item.subject;
    document.getElementById("preview-body").value = item.body;

    document.getElementById("preview-list-container").style.display = "none";
    document.getElementById("preview-detail-container").style.display = "block";
    document.getElementById("modal-actions-list").style.display = "none";
    document.getElementById("modal-actions-detail").style.display = "flex";
    document.getElementById("btn-back-to-list").style.display = "block";
    document.getElementById("preview-counter").innerText = `${index + 1} of ${currentQueue.length}`;
}

function closePreview() {
    document.getElementById("preview-modal").classList.remove("active");
}

function handleSendAll(mode) {
    currentMode = mode;
    currentQueue = mode === "outreach" ? [...outreachQueue] : [...inboxQueue];
    if (!currentQueue.length) return;
    sendAll();
}

function sendIndividual() {
    const item = currentQueue[currentIndex];
    processSend(item);
    currentQueue.splice(currentIndex, 1);
    if (!currentQueue.length) {
        closePreview();
        return;
    }
    showListView();
}

function sendAll() {
    const total = currentQueue.length;
    currentQueue.forEach((item) => processSend(item));
    currentQueue = [];
    closePreview();
    const log = document.getElementById(currentMode === "outreach" ? "outreach-output" : "inbox-output");
    addLog(log, `${total} item(s) prepared.`, "success");
}

function processSend(item) {
    const liveItem = getLiveMailboxItem();

    if (currentMode === "inbox" && liveItem) {
        liveItem.displayReplyAllForm({
            htmlBody: item.body.replace(/\n/g, "<br>")
        });
        return;
    }

    if (liveItem) {
        Office.context.mailbox.displayNewMessageForm({
            toRecipients: [item.to],
            subject: item.subject,
            htmlBody: item.body.replace(/\n/g, "<br>")
        });
    } else {
        const mailto = buildMailtoUrl(item);
        window.open(mailto, "_blank");
        const log = document.getElementById(currentMode === "outreach" ? "outreach-output" : "inbox-output");
        addLog(log, `Opened draft for ${item.displayTo || item.to} in your mail client.`, "info");
    }

    const planRow = planRows.find((row) => row.Journalist === item.journalist);
    if (planRow) planRow.Status = "Draft Opened";
    renderPlan();
}

function getLiveMailboxItem() {
    return OFFICE_AVAILABLE && Office.context && Office.context.mailbox
        ? Office.context.mailbox.item
        : null;
}

function extractOfficeEmail(item) {
    return new Promise((resolve) => {
        if (!item || !item.body || !item.from) {
            resolve(null);
            return;
        }

        item.body.getAsync(Office.CoercionType.Text, (result) => {
            if (result.status !== Office.AsyncResultStatus.Succeeded) {
                resolve(null);
                return;
            }

            resolve({
                fromName: item.from.displayName || item.from.emailAddress,
                fromEmail: item.from.emailAddress,
                subject: item.subject,
                body: result.value
            });
        });
    });
}

function buildMailtoUrl(item) {
    const subject = encodeURIComponent(item.subject);
    const body = encodeURIComponent(item.body);
    return `mailto:${encodeURIComponent(item.to)}?subject=${subject}&body=${body}`;
}

async function resolveBackendUrl() {
    if (BACKEND_OVERRIDE) return BACKEND_OVERRIDE;

    const localStatus = await fetchStatus(LOCAL_BACKEND_URL);
    const isLocalBrowserDemo = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const remoteStatus = await fetchStatus(REMOTE_BACKEND_URL);

    if (isLocalBrowserDemo) {
        if (localStatus?.llmConfigured) return LOCAL_BACKEND_URL;
        if (remoteStatus?.llmConfigured) return REMOTE_BACKEND_URL;
        if (localStatus) return LOCAL_BACKEND_URL;
        if (remoteStatus) return REMOTE_BACKEND_URL;
        return LOCAL_BACKEND_URL;
    }

    if (localStatus?.llmConfigured) return LOCAL_BACKEND_URL;
    if (remoteStatus?.llmConfigured) return REMOTE_BACKEND_URL;
    if (localStatus) return LOCAL_BACKEND_URL;
    if (remoteStatus) return REMOTE_BACKEND_URL;
    return LOCAL_BACKEND_URL;
}

async function fetchStatus(url) {
    try {
        const response = await fetch(`${url}/status`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

function addLog(container, text, type) {
    const entry = document.createElement("div");
    entry.className = `log-entry log-${type}`;
    entry.innerText = `> ${text}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
