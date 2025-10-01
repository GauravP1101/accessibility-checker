const scanBtn      = document.getElementById('scanBtn');
const summaryText  = document.getElementById('summaryText');
const groupsRoot   = document.getElementById('groups');
const summaryCards = document.getElementById('summaryCards');
const toolbar      = document.getElementById('toolbar');

const statTotal  = document.getElementById('statTotal');
const statLow    = document.getElementById('statLow');
const statMedium = document.getElementById('statMedium');
const statHigh   = document.getElementById('statHigh');

const expandAllBtn   = document.getElementById('expandAll');
const collapseAllBtn = document.getElementById('collapseAll');
const copyReportBtn  = document.getElementById('copyReport');
const exportJsonBtn  = document.getElementById('exportJson');
const exportCsvBtn   = document.getElementById('exportCsv');

let lastResults = null;
let activeFilter = 'all';

// Optional theme toggles:
// document.body.classList.add('light');   // light theme

function severityOrder(sev) { return sev === 'high' ? 0 : sev === 'medium' ? 1 : 2; }
function iconFor(type) {
  switch (type) {
    case 'contrast': return '🌓';
    case 'image-alt': return '🖼️';
    case 'interactive-name': return '🔗';
    case 'form-label': return '📝';
    case 'focus-outline': return '⌨️';
    case 'document-language': return '🌐';
    default: return '🔎';
  }
}
function groupByType(issues) {
  const map = new Map();
  for (const it of issues) {
    if (!map.has(it.type)) map.set(it.type, []);
    map.get(it.type).push(it);
  }
  return Array.from(map.entries()).map(([type, arr]) => ({
    type, title: arr[0]?.groupTitle || type, issues: arr.sort((a,b) =>
      severityOrder(a.severity) - severityOrder(b.severity))
  })).sort((a,b) => b.issues.length - a.issues.length);
}

function render(results) {
  lastResults = results;
  const { issues, countsBySeverity } = results;

  statTotal.textContent  = issues.length;
  statLow.textContent    = countsBySeverity.low || 0;
  statMedium.textContent = countsBySeverity.medium || 0;
  statHigh.textContent   = countsBySeverity.high || 0;

  summaryText.textContent =
    issues.length
      ? `We found ${issues.length} thing${issues.length === 1 ? '' : 's'} that could make this page harder to use.`
      : 'Great news! No common issues were found.';

  summaryCards.hidden = false;
  toolbar.hidden = issues.length === 0;

  const filtered = issues.filter(it => activeFilter === 'all' || it.severity === activeFilter);
  const grouped = groupByType(filtered);

  groupsRoot.innerHTML = '';
  for (const g of grouped) {
    const group = document.createElement('div');
    group.className = 'group open';

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <div class="group-title">
        <span>${iconFor(g.type)}</span>
        <span>${g.title}</span>
      </div>
      <div class="group-count">${g.issues.length} item${g.issues.length === 1 ? '' : 's'} <span class="chev">›</span></div>
    `;
    header.addEventListener('click', () => group.classList.toggle('open'));

    const list = document.createElement('div');
    list.className = 'issue-list';

    for (const it of g.issues) {
      const item = document.createElement('div');
      item.className = 'issue';
      item.dataset.severity = it.severity;

      item.innerHTML = `
        <div class="issue-header">
          <span class="badge ${it.severity}">${it.severity.toUpperCase()}</span>
          <div class="issue-title">${it.plainTitle}</div>
          <div class="issue-actions">
            ${it.selector ? `<button class="btn btn-ghost btn-sm" data-action="highlight">Highlight</button>` : ''}
            ${it.wcag ? `<button class="btn btn-ghost btn-sm" data-action="learn">What is this?</button>` : ''}
          </div>
        </div>
        <div class="issue-body">
          <div>${it.plainWhy}</div>
          <div class="kv"><b>How to fix:</b> <div>${it.plainFix}</div></div>
          ${it.selector ? `<div class="kv"><b>Where:</b> <span class="code">${it.selector}</span></div>` : ''}
          ${it.example ? `<div class="kv"><b>Example:</b> <span class="code">${it.example}</span></div>` : ''}
        </div>
      `;

      const actions = item.querySelector('.issue-actions');
      actions?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.action === 'highlight' && it.selector) {
          highlightSelector(it.selector);
        } else if (btn.dataset.action === 'learn' && it.wcag) {
          openWcagHelp(it);
        }
      });

      list.appendChild(item);
    }

    group.append(header, list);
    groupsRoot.appendChild(group);
  }
}

function openWcagHelp(issue) {
  const text = `${issue.wcag.title} (${issue.wcag.id})
Why it matters: ${issue.plainWhy}
Fix in short: ${issue.plainFix}
Learn more: ${issue.wcag.link}`;
  navigator.clipboard.writeText(text).catch(()=>{});
  alert(`Copied quick explainer to clipboard.\n\nAlso see:\n${issue.wcag.link}`);
}

async function highlightSelector(selector) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT', selector });
}

scanBtn.addEventListener('click', async () => {
  summaryText.textContent = 'Scanning…';
  groupsRoot.innerHTML = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'RUN_A11Y_SCAN' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      summaryText.textContent = 'Unable to scan this page.';
      return;
    }
    render(response);
  });
});

// Filters
document.querySelectorAll('.segment').forEach(seg => {
  seg.addEventListener('click', () => {
    document.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
    seg.classList.add('active');
    activeFilter = seg.dataset.filter;
    if (lastResults) render(lastResults);
  });
});

// Expand/Collapse
expandAllBtn.addEventListener('click', () => {
  document.querySelectorAll('.group').forEach(g => g.classList.add('open'));
});
collapseAllBtn.addEventListener('click', () => {
  document.querySelectorAll('.group').forEach(g => g.classList.remove('open'));
});

// Copy summary
copyReportBtn.addEventListener('click', () => {
  if (!lastResults) return;
  const { counts, issues } = lastResults;
  const text = [
    `Total issues: ${issues.length}`,
    Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`).join('\n'),
    '',
    ...issues.map((it,i)=>
      `${i+1}) [${it.severity.toUpperCase()}] ${it.plainTitle}
Why: ${it.plainWhy}
Fix: ${it.plainFix}
${it.selector ? `Where: ${it.selector}\n` : ''}`
    )
  ].join('\n');
  navigator.clipboard.writeText(text).then(()=> {
    copyReportBtn.textContent = 'Copied!';
    setTimeout(()=>copyReportBtn.textContent='Copy summary', 1200);
  });
});

// Export JSON
exportJsonBtn.addEventListener('click', () => {
  if (!lastResults) return;
  const blob = new Blob([JSON.stringify(lastResults, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'a11y-report.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
});

// -------- CSV export --------
function csvEscape(val) {
  if (val == null) return '';
  const str = String(val);
  const needsQuotes = /[",\n\r]/.test(str);
  const out = str.replace(/"/g, '""');
  return needsQuotes ? `"${out}"` : out;
}
function buildCsv(issues) {
  const headers = [
    'Severity','Group','Issue','Why it matters','How to fix',
    'Selector','Example','WCAG ID','WCAG Title','WCAG Link'
  ];
  const rows = issues.map(it => [
    it.severity?.toUpperCase() || '',
    it.groupTitle || '',
    it.plainTitle || '',
    it.plainWhy || '',
    it.plainFix || '',
    it.selector || '',
    it.example || '',
    it.wcag?.id || '',
    it.wcag?.title || '',
    it.wcag?.link || ''
  ]);
  const all = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n');
  return '\uFEFF' + all; // BOM for Excel UTF-8
}
exportCsvBtn.addEventListener('click', () => {
  if (!lastResults) return;
  const csv = buildCsv(lastResults.issues); // export all issues (not just filtered)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'a11y-report.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
});
