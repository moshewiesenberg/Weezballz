let mockPlan = [
    { outlet: 'Tech Outlet Daily', journalist: 'Jordan Lee', email: 'jlee@techoutletdaily.example', timing: 'Week 1', draft: 'Trend', status: 'Pending', subject: 'Fast care is becoming the default', body: 'Hi Jordan, I saw your recent coverage on AI infrastructure...' },
    { outlet: 'Healthcare Business Weekly', journalist: 'Samara Patel', email: 'spatel@hbweekly.example', timing: 'Week 1', draft: 'Founder Story', status: 'Pending', subject: 'The future of "fast clarity" care', body: 'Hi Samara, Following your piece on healthcare efficiency...' },
    { outlet: 'Consumer Life Magazine', journalist: 'Alyssa Chen', email: 'achen@clm.example', timing: 'Week 2', draft: 'Consumer', status: 'Not Started', subject: 'Skin anxiety is rising', body: 'Hi Alyssa, With the rise of self-triaging online...' },
    { outlet: 'Chicago Startup News', journalist: 'Matt Rivera', email: 'mrivera@csn.example', timing: 'Week 2', draft: 'Local', status: 'Pending', subject: 'Chicago area startup focused on skin', body: 'Hi Matt, As a fellow Chicagoan...' },
    { outlet: 'Podcast: The Modern Patient', journalist: 'Erin Brooks', email: 'erin@modernpatient.example', timing: 'Week 3', draft: 'Podcast', status: 'Not Started', subject: 'Podcast guest: DappleDoc Founder', body: 'Hi Erin, I love "The Modern Patient"...' }
];

let mockInbox = [
    { id: 0, from: 'Sarah Perez', subject: 'Re: Story Idea', body: 'This sounds interesting. Can you send a demo?', intent: 'interested', actionText: 'Reply with Demo Link', actionSubject: 'RE: Story Idea - Demo Link', actionBody: 'Hi Sarah, Glad you are interested! Here is the demo link...' },
    { id: 1, from: 'Lex Fridman', subject: 'Re: Guest Suggestion', body: 'I would love to chat. What is your schedule?', intent: 'scheduling', actionText: 'Propose Times', actionSubject: 'Meeting: DappleDoc x Lex Fridman', actionBody: 'Hi Lex, Excited to chat! Would next Tuesday at 2pm ET work?' },
    { id: 2, from: 'System', subject: 'Out of Office', body: 'I am away until Monday.', intent: 'none' }
];

let currentQueue = [];
let currentIndex = 0;
let currentMode = 'outreach'; // 'outreach' or 'inbox'
let isOutreachPersonalized = false;
let isInboxAnalyzed = false;

// UI Rendering
function renderPlan() {
    const container = document.getElementById('plan-table-container');
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">';
    html += '<tr style="text-align: left; border-bottom: 1px solid var(--border); color: var(--text-secondary);"><th>Outlet</th><th>Journalist</th><th>Status</th></tr>';
    mockPlan.forEach(row => {
        const badgeClass = row.status === 'Sent' ? 'status-done' : 'status-pending';
        html += `<tr style="border-bottom: 1px solid var(--border); height: 2.5rem;">
            <td>${row.outlet}</td>
            <td>${row.journalist}</td>
            <td><span class="status-badge ${badgeClass}">${row.status}</span></td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
}

// Outreach Execution logic
async function runScan() {
    const log = document.getElementById('outreach-output');
    log.innerHTML = '';
    addLog(log, 'Agent scanning pr_plan.csv...', 'info');

    await delay(800);
    const pending = mockPlan.filter(r => r.status !== 'Sent');
    addLog(log, `Found ${pending.length} pending actions.`, 'success');
    document.getElementById('btn-review-outreach').disabled = false;
    document.getElementById('btn-send-all-outreach').disabled = false;
    isOutreachPersonalized = false;
}

async function ensureOutreachPersonalized() {
    if (isOutreachPersonalized) return;
    const log = document.getElementById('outreach-output');
    addLog(log, 'Fetching messaging_guidance.md...', 'info');
    await delay(600);
    addLog(log, 'Personalizing drafts via DappleDoc AI...', 'info');
    mockPlan.filter(r => r.status !== 'Sent').forEach(r => {
        addLog(log, `[DRAFT] Template '${r.draft}' personalized for ${r.journalist}`, 'success');
    });
    isOutreachPersonalized = true;
    await delay(400);
}

// Inbox Monitor logic
async function checkInbox() {
    const log = document.getElementById('inbox-output');
    log.innerHTML = '';
    addLog(log, 'Agent monitoring Outlook inbox...', 'info');

    await delay(1000);
    mockInbox.forEach(mail => {
        if (mail.intent === 'interested') {
            addLog(log, `[INTEREST] ${mail.from}: "${mail.body.substring(0, 20)}..."`, 'success');
            addLog(log, `--> AI Action: ${mail.actionText}`, 'info');
        } else if (mail.intent === 'scheduling') {
            addLog(log, `[CALENDAR] ${mail.from} wants to schedule.`, 'success');
            addLog(log, `--> AI Action: ${mail.actionText}`, 'info');
        } else {
            addLog(log, `[IGNORE] ${mail.from}: Automated/OOO response.`, 'info');
        }
    });
    document.getElementById('btn-review-inbox').disabled = false;
    document.getElementById('btn-send-all-inbox').disabled = false;
    isInboxAnalyzed = true;
}

// Modal Toggle Logic
async function handleReview(mode) {
    if (mode === 'outreach') {
        await ensureOutreachPersonalized();
    }
    openPreview(mode);
}

async function handleSendAll(mode) {
    if (mode === 'outreach') {
        await ensureOutreachPersonalized();
    }
    currentMode = mode;
    // Prepare the queue same as openPreview does but don't show UI
    if (mode === 'outreach') {
        currentQueue = mockPlan.filter(r => r.status !== 'Sent').map(r => ({
            to: `${r.journalist} <${r.email}>`,
            subject: r.subject,
            body: r.body,
            id: r.journalist
        }));
    } else {
        currentQueue = mockInbox.filter(m => m.intent !== 'none').map(m => ({
            to: m.from,
            subject: m.actionSubject,
            body: m.actionBody,
            id: m.id
        }));
    }

    sendAll();
}

// Modal Data Logic
function openPreview(mode) {
    currentMode = mode;
    // Prepare queue as before
    if (mode === 'outreach') {
        currentQueue = mockPlan.filter(r => r.status !== 'Sent').map(r => ({
            to: `${r.journalist} <${r.email}>`,
            journal: r.outlet,
            subject: r.subject,
            body: r.body,
            id: r.journalist,
            type: 'Draft'
        }));
        document.getElementById('modal-title').innerText = 'Review Outreach Drafts';
    } else {
        currentQueue = mockInbox.filter(m => m.intent !== 'none').map(m => ({
            to: m.from,
            journal: 'Inbox Action',
            subject: m.actionSubject,
            body: m.actionBody,
            id: m.id,
            type: m.intent === 'interested' ? 'Reply' : 'Invite'
        }));
        document.getElementById('modal-title').innerText = 'Review Inbox Actions';
    }

    if (currentQueue.length > 0) {
        showListView();
        document.getElementById('preview-modal').classList.add('active');
    } else {
        const logId = currentMode === 'outreach' ? 'outreach-output' : 'inbox-output';
        addLog(document.getElementById(logId), 'Nothing to review.', 'info');
    }
}

function showListView() {
    // UI State
    document.getElementById('preview-list-container').style.display = 'block';
    document.getElementById('preview-detail-container').style.display = 'none';
    document.getElementById('modal-actions-list').style.display = 'flex';
    document.getElementById('modal-actions-detail').style.display = 'none';
    document.getElementById('btn-back-to-list').style.display = 'none';
    document.getElementById('preview-counter').innerText = `${currentQueue.length} Pending Actions`;

    // Render List
    const listContainer = document.getElementById('recipient-list');
    listContainer.innerHTML = '';

    currentQueue.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'recipient-item';
        div.innerHTML = `
            <div class="recipient-item-info">
                <span class="recipient-name">${item.to.split('<')[0]}</span>
                <span class="recipient-detail">${item.journal}</span>
            </div>
            <span class="recipient-status">${item.type}</span>
        `;
        div.addEventListener('click', () => showDetailView(index));
        listContainer.appendChild(div);
    });
}

function showDetailView(index) {
    currentIndex = index;
    const item = currentQueue[index];

    // Fill Form
    document.getElementById('preview-to').value = item.to;
    document.getElementById('preview-subject').value = item.subject;
    document.getElementById('preview-body').value = item.body;

    // UI State
    document.getElementById('preview-list-container').style.display = 'none';
    document.getElementById('preview-detail-container').style.display = 'block';
    document.getElementById('modal-actions-list').style.display = 'none';
    document.getElementById('modal-actions-detail').style.display = 'flex';
    document.getElementById('btn-back-to-list').style.display = 'block';
    document.getElementById('preview-counter').innerText = `Reviewing ${index + 1} of ${currentQueue.length}`;
}

function closePreview() {
    document.getElementById('preview-modal').classList.remove('active');
}

// Light Editing Listeners
document.getElementById('preview-subject').addEventListener('input', (e) => {
    if (currentQueue[currentIndex]) currentQueue[currentIndex].subject = e.target.value;
});
document.getElementById('preview-body').addEventListener('input', (e) => {
    if (currentQueue[currentIndex]) currentQueue[currentIndex].body = e.target.value;
});

// Execution Logic
function sendIndividual() {
    const item = currentQueue[currentIndex];
    processSend(item);

    // Remove from queue
    currentQueue.splice(currentIndex, 1);

    if (currentQueue.length === 0) {
        closePreview();
    } else {
        // Go back to list to see remaining
        showListView();
    }
}

function sendAll() {
    const total = currentQueue.length;
    currentQueue.forEach(item => processSend(item));
    currentQueue = [];
    closePreview();

    const logId = currentMode === 'outreach' ? 'outreach-output' : 'inbox-output';
    const log = document.getElementById(logId);
    addLog(log, `Batch complete: ${total} actions processed.`, 'success');
}

function processSend(item) {
    const logId = currentMode === 'outreach' ? 'outreach-output' : 'inbox-output';
    const log = document.getElementById(logId);
    addLog(log, `[SENT] To: ${item.to} | Subject: ${item.subject}`, 'success');

    if (currentMode === 'outreach') {
        const planItem = mockPlan.find(r => r.journalist === item.id);
        if (planItem) {
            planItem.status = 'Sent';
            renderPlan();
        }
    } else {
        if (item.subject.includes('Meeting')) {
            triggerScheduling(item.to);
        }
    }
}

// Scheduler Logic
function triggerScheduling(sender) {
    const log = document.getElementById('calendar-output');
    log.innerHTML = '';
    addLog(log, `Detecting availability for ${sender}...`, 'info');
    setTimeout(() => {
        addLog(log, `Proposed: Tuesday 2pm or Wednesday 10am`, 'success');
        addLog(log, `Invite draft saved to Outlook.`, 'info');
    }, 1500);
}

// Chain E2E Logic
async function chainAll() {
    await runScan();
    await handleReview('outreach');
}

// Utilities
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addLog(container, text, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerText = `> ${text}`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

// Initialization
document.getElementById('btn-scan-plan').addEventListener('click', runScan);
document.getElementById('btn-review-outreach').addEventListener('click', () => handleReview('outreach'));
document.getElementById('btn-send-all-outreach').addEventListener('click', () => handleSendAll('outreach'));

document.getElementById('btn-check-inbox').addEventListener('click', checkInbox);
document.getElementById('btn-review-inbox').addEventListener('click', () => handleReview('inbox'));
document.getElementById('btn-send-all-inbox').addEventListener('click', () => handleSendAll('inbox'));

document.getElementById('btn-close-modal').addEventListener('click', closePreview);
document.getElementById('btn-back-to-list').addEventListener('click', showListView);

// Action Buttons
document.getElementById('btn-send-all-modal').addEventListener('click', sendAll);
document.getElementById('btn-send-individual').addEventListener('click', sendIndividual);


const chainBtn = document.getElementById('btn-chain');
if (chainBtn) chainBtn.addEventListener('click', chainAll);

renderPlan();
