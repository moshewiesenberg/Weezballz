const mockPlan = [
    { outlet: 'Tech Outlet Daily', journalist: 'Jordan Lee', email: 'jlee@techoutletdaily.example', timing: 'Week 1', draft: 'Trend', status: 'Pending' },
    { outlet: 'Healthcare Business Weekly', journalist: 'Samara Patel', email: 'spatel@hbweekly.example', timing: 'Week 1', draft: 'Founder Story', status: 'Pending' },
    { outlet: 'Consumer Life Magazine', journalist: 'Alyssa Chen', email: 'achen@clm.example', timing: 'Week 2', draft: 'Consumer', status: 'Not Started' },
    { outlet: 'Chicago Startup News', journalist: 'Matt Rivera', email: 'mrivera@csn.example', timing: 'Week 2', draft: 'Local', status: 'Pending' },
    { outlet: 'Podcast: The Modern Patient', journalist: 'Erin Brooks', email: 'erin@modernpatient.example', timing: 'Week 3', draft: 'Podcast', status: 'Not Started' }
];

const mockInbox = [
    { from: 'Sarah Perez', subject: 'Re: Story Idea', body: 'This sounds interesting. Can you send a demo?', intent: 'interested' },
    { from: 'Lex Fridman', subject: 'Re: Guest Suggestion', body: 'I would love to chat. What is your schedule?', intent: 'scheduling' },
    { from: 'System', subject: 'Out of Office', body: 'I am away until Monday.', intent: 'none' }
];

// PoC 1 Logic
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

// PoC 1: Scan
function runScan() {
    const log = document.getElementById('outreach-output');
    log.innerHTML = '';
    addLog(log, 'Agent scanning pr_plan.csv...', 'info');

    setTimeout(() => {
        const pending = mockPlan.filter(r => r.status !== 'Sent');
        addLog(log, `Found ${pending.length} pending actions.`, 'success');
        document.getElementById('btn-personalize').disabled = false;
    }, 800);
}

// PoC 2 & 3: Personalize
function runPersonalization() {
    const log = document.getElementById('outreach-output');
    addLog(log, 'Fetching messaging_guidance.md...', 'info');

    setTimeout(() => {
        addLog(log, 'Personalizing drafts via DappleDoc AI...', 'info');
        mockPlan.filter(r => r.status !== 'Sent').forEach(r => {
            addLog(log, `[DRAFT] Template '${r.draft}' personalized for ${r.journalist}`, 'success');
        });
        document.getElementById('btn-send').disabled = false;
    }, 1200);
}

// PoC 4 Logic: Inbox Monitor
function checkInbox() {
    const log = document.getElementById('inbox-output');
    log.innerHTML = '';
    addLog(log, 'Agent monitoring Outlook inbox...', 'info');

    setTimeout(() => {
        mockInbox.forEach(mail => {
            if (mail.intent === 'interested') {
                addLog(log, `[INTEREST] ${mail.from}: "${mail.body.substring(0, 20)}..."`, 'success');
                addLog(log, `--> Flagged: Needs Follow-up`, 'info');
            } else if (mail.intent === 'scheduling') {
                addLog(log, `[CALENDAR] ${mail.from} wants to schedule.`, 'success');
                triggerScheduling(mail.from);
            } else {
                addLog(log, `[IGNORE] ${mail.from}: Automated/OOO response.`, 'info');
            }
        });
    }, 1000);
}

// PoC 5 Logic: Scheduler
function triggerScheduling(sender) {
    const log = document.getElementById('calendar-output');
    log.innerHTML = '';
    addLog(log, `Detecting availability for ${sender}...`, 'info');
    setTimeout(() => {
        addLog(log, `Proposed: Tuesday 2pm or Wednesday 10am`, 'success');
        addLog(log, `Invite draft saved to Outlook.`, 'info');
    }, 1500);
}

// PoC Stretch Goal: Chain Agents
async function chainAll() {
    const outreachLog = document.getElementById('outreach-output');
    const inboxLog = document.getElementById('inbox-output');
    const schedulerLog = document.getElementById('calendar-output');

    outreachLog.innerHTML = '';
    inboxLog.innerHTML = '';
    schedulerLog.innerHTML = '';

    addLog(outreachLog, 'STARTING END-TO-END FLOW', 'info');

    // Step 1: Scan
    addLog(outreachLog, '1. Scanning PR Plan...', 'info');
    await delay(1000);
    addLog(outreachLog, '2. Found 4 pending outlets.', 'success');

    // Step 2: Personalize
    addLog(outreachLog, '3. Personalizing emails with DappleDoc AI...', 'info');
    await delay(1500);
    addLog(outreachLog, '4. All drafts prepared in Outlook.', 'success');

    // Step 3: Inbox Monitoring
    addLog(inboxLog, '5. Monitoring for replies from previous sends...', 'info');
    await delay(2000);
    addLog(inboxLog, '[REPLY] Lex Fridman: "Let\'s record next Tuesday!"', 'success');
    addLog(inboxLog, '--> Intent: Scheduling. Notifying user.', 'info');

    // Step 4: Scheduling
    triggerScheduling('Lex Fridman');
}

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

// Init
document.getElementById('btn-scan-plan').addEventListener('click', runScan);
document.getElementById('btn-personalize').addEventListener('click', runPersonalization);
document.getElementById('btn-check-inbox').addEventListener('click', checkInbox);
const chainBtn = document.getElementById('btn-chain');
if (chainBtn) chainBtn.addEventListener('click', chainAll);

renderPlan();
