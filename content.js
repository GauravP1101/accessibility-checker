// ---------- Color/contrast helpers ----------
function parseColorToRGB(str){
  const c=document.createElement('canvas').getContext('2d');
  c.fillStyle=str;
  const hex=c.fillStyle.startsWith('#')?c.fillStyle:'#000000';
  const i=parseInt(hex.slice(1),16);
  return{r:(i>>16)&255,g:(i>>8)&255,b:i&255};
}
function relLuminance({r,g,b}){
  const s=[r,g,b].map(v=>v/255),t=v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
  const[R,G,B]=s.map(t);return 0.2126*R+0.7152*G+0.0722*B;
}
function contrastRatio(fg,bg){
  const L1=relLuminance(parseColorToRGB(fg)),L2=relLuminance(parseColorToRGB(bg));
  const a=Math.max(L1,L2),d=Math.min(L1,L2);return (a+0.05)/(d+0.05);
}
function isLargeText(style){
  const px=parseFloat(style.fontSize)||0;
  const bold=(style.fontWeight&&parseInt(style.fontWeight,10)>=700)||/bold/i.test(style.fontWeight);
  return px>=24||(bold&&px>=18.66);
}
function getEffectiveBgColor(el){
  let n=el;
  while(n&&n!==document.documentElement){
    const cs=getComputedStyle(n);
    if(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent'){
      return cs.backgroundColor;
    }
    n=n.parentElement;
  }
  return getComputedStyle(document.documentElement).backgroundColor||'#ffffff';
}

// ---------- Name/label helpers ----------
function hasAccessibleName(el){
  const al=el.getAttribute('aria-label');
  const lb=el.getAttribute('aria-labelledby');
  const title=el.getAttribute('title');
  const text=(el.textContent||'').trim();
  if(al&&al.trim())return true;
  if(lb){
    const name=lb.split(/\s+/).map(id=>document.getElementById(id)).filter(Boolean).map(n=>n.textContent||'').join(' ').trim();
    if(name)return true;
  }
  if(text)return true;
  if(title&&title.trim())return true;
  return false;
}
function isFocusable(el){
  const f=['A','BUTTON','INPUT','SELECT','TEXTAREA'];
  if(f.includes(el.tagName))return true;
  const ti=el.getAttribute('tabindex');
  if(ti!==null&&parseInt(ti,10)>=0)return true;
  const role=el.getAttribute('role');
  if(['button','link','checkbox','switch','textbox','tab','menuitem','radio','combobox','spinbutton','slider'].includes(role))return true;
  return false;
}
function cssSelector(el){
  try{
    const path=[];let node=el;
    while(node&&node.nodeType===1&&node!==document){
      let sel=node.nodeName.toLowerCase();
      if(node.id){ sel+=`#${node.id}`; path.unshift(sel); break; }
      else{
        let sib=node,nth=1;
        while(sib=sib.previousElementSibling){ if(sib.nodeName===node.nodeName) nth++; }
        sel+=`:nth-of-type(${nth})`;
      }
      path.unshift(sel);
      node=node.parentElement;
    }
    return path.join(' > ');
  }catch{return el.tagName.toLowerCase();}
}

// ---------- WCAG references & plain-English mapping ----------
const WCAG = {
  'image-alt': { id: '1.1.1', title: 'Text Alternatives', link: 'https://www.w3.org/WAI/WCAG21/quickref/#non-text-content' },
  'interactive-name': { id: '4.1.2', title: 'Name, Role, Value', link: 'https://www.w3.org/WAI/WCAG21/quickref/#name-role-value' },
  'form-label': { id: '3.3.2', title: 'Labels or Instructions', link: 'https://www.w3.org/WAI/WCAG21/quickref/#labels-or-instructions' },
  'contrast': { id: '1.4.3', title: 'Contrast (Minimum)', link: 'https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum' },
  'focus-outline': { id: '2.4.7', title: 'Focus Visible', link: 'https://www.w3.org/WAI/WCAG21/quickref/#focus-visible' },
  'document-language': { id: '3.1.1', title: 'Language of Page', link: 'https://www.w3.org/WAI/WCAG21/quickref/#language-of-page' }
};
function decorate(issue){
  const map = {
    'image-alt': {
      plainTitle: 'Image without a helpful description',
      plainWhy: 'People using screen readers cannot see images. A short description lets them understand what the image shows.',
      plainFix: 'Add a short “alt” description that explains the image’s purpose. If it is only decorative, set alt="" (empty).',
      severity: 'medium', groupTitle: 'Images'
    },
    'interactive-name': {
      plainTitle: 'Link or button without a name',
      plainWhy: 'Without a clear name, assistive tech users cannot tell what a link or button will do.',
      plainFix: 'Add visible text or an aria-label that says what the control does (e.g., “Submit form”, “Open menu”).',
      severity: 'high', groupTitle: 'Buttons & links'
    },
    'form-label': {
      plainTitle: 'Form field without a label',
      plainWhy: 'People may not know what to type without a clear label connected to each field.',
      plainFix: 'Add a label element linked by “for” and the input’s “id”, or use aria-label/aria-labelledby.',
      severity: 'high', groupTitle: 'Forms'
    },
    'contrast': {
      plainTitle: 'Text is hard to read against its background',
      plainWhy: 'Low contrast makes text difficult to read, especially for people with low vision or on mobile in sunlight.',
      plainFix: 'Darken the text or lighten the background so the contrast ratio meets the minimum requirement.',
      severity: 'medium', groupTitle: 'Color & contrast'
    },
    'focus-outline': {
      plainTitle: 'Keyboard focus is hard to see',
      plainWhy: 'People who use a keyboard need a clear outline to see where they are on the page.',
      plainFix: 'Provide a visible focus style (outline or box-shadow) for links, buttons, and inputs.',
      severity: 'medium', groupTitle: 'Keyboard & focus'
    },
    'document-language': {
      plainTitle: 'Page language is not set',
      plainWhy: 'Assistive tech needs the page’s language to pronounce words correctly.',
      plainFix: 'Add <html lang="en"> (or the correct language code) at the top of the page.',
      severity: 'low', groupTitle: 'Page settings'
    }
  };
  const wcag = WCAG[issue.type] || null;
  const enrich = map[issue.type] || {};
  return Object.assign(issue, enrich, { wcag });
}

// ---------- Checks ----------
function checkMissingLang() {
  const html = document.documentElement;
  if (!html.hasAttribute('lang') || !html.getAttribute('lang').trim()) {
    return [decorate({
      type: 'document-language',
      message: 'Missing `lang` attribute on the <html> element.',
      selector: 'html',
      fix: 'Add <html lang="en">.'
    })];
  }
  return [];
}

function checkImagesAlt() {
  const issues = [];
  const imgs = Array.from(document.querySelectorAll('img'));
  for (const img of imgs) {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    const isDecorative = role === 'presentation' || role === 'none' || (alt !== null && alt.trim() === '');
    if (alt === null && !isDecorative) {
      issues.push(decorate({
        type: 'image-alt',
        message: 'Image missing alt text.',
        selector: cssSelector(img),
        example: img.src ? img.src.slice(0, 120) : '',
        fix: 'Provide concise alt text.'
      }));
    }
  }
  return issues;
}

function checkInteractiveNames() {
  const issues = [];
  const links = Array.from(document.querySelectorAll('a[href]'));
  const buttons = Array.from(document.querySelectorAll('button'));
  const interactive = [...links, ...buttons];
  for (const el of interactive) {
    if (!hasAccessibleName(el)) {
      issues.push(decorate({
        type: 'interactive-name',
        message: `${el.tagName.toLowerCase()} has no accessible name.`,
        selector: cssSelector(el),
        fix: 'Add text or aria-label.'
      }));
    }
  }
  return issues;
}

function checkFormLabels() {
  const issues = [];
  const controls = Array.from(document.querySelectorAll('input, select, textarea'));
  for (const c of controls) {
    const type = (c.getAttribute('type') || '').toLowerCase();
    if (type === 'hidden') continue;

    const hasAria = (c.getAttribute('aria-label') && c.getAttribute('aria-label').trim()) || c.getAttribute('aria-labelledby');
    let hasLabel = false;

    if (c.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(c.id)}"]`);
      if (lbl && lbl.textContent.trim()) hasLabel = true;
    }
    if (!hasLabel) {
      const parentLabel = c.closest('label');
      if (parentLabel && parentLabel.textContent.trim()) hasLabel = true;
    }

    if (!hasLabel && !hasAria) {
      issues.push(decorate({
        type: 'form-label',
        message: 'Form control missing an associated label.',
        selector: cssSelector(c),
        fix: 'Add label or aria-label.'
      }));
    }
  }
  return issues;
}

function checkContrast() {
  const issues = [];
  const all = Array.from(document.querySelectorAll('body *')).filter(el => {
    const cs = getComputedStyle(el);
    return el.childNodes.length &&
           Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 0) &&
           cs.visibility !== 'hidden' &&
           cs.display !== 'none' &&
           parseFloat(cs.opacity) > 0.01;
  });

  for (const el of all) {
    const cs = getComputedStyle(el);
    const fg = cs.color;
    const bg = getEffectiveBgColor(el);
    const ratio = contrastRatio(fg, bg);
    const large = isLargeText(cs);
    const threshold = large ? 3.0 : 4.5;

    if (ratio < threshold) {
      issues.push(decorate({
        type: 'contrast',
        message: `Low contrast: ${ratio.toFixed(2)}:1 (needs ≥ ${threshold}:1).`,
        selector: cssSelector(el),
        example: `color: ${fg}, background: ${bg}`,
        fix: 'Increase contrast to meet minimum ratio.'
      }));
    }
  }
  return issues;
}

function checkFocusOutline() {
  const issues = [];
  const candidates = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'));
  for (const el of candidates) {
    const cs = getComputedStyle(el);
    if (isFocusable(el) && (cs.outlineStyle === 'none' || cs.outlineWidth === '0px')) {
      issues.push(decorate({
        type: 'focus-outline',
        message: 'Focusable element removes focus outline.',
        selector: cssSelector(el),
        fix: 'Provide a visible focus style.'
      }));
    }
  }
  return issues;
}

// ---------- Highlight utility ----------
function highlight(selector) {
  const el = document.querySelector(selector);
  if (!el) return false;
  const prev = el.style.outline;
  const prevOffset = el.style.outlineOffset;
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  el.style.outline = '3px solid #ff6b6b';
  el.style.outlineOffset = '2px';
  setTimeout(() => { el.style.outline = prev; el.style.outlineOffset = prevOffset; }, 2000);
  return true;
}

// ---------- Message handler ----------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'RUN_A11Y_SCAN') {
    const allIssues = [
      ...checkMissingLang(),
      ...checkImagesAlt(),
      ...checkInteractiveNames(),
      ...checkFormLabels(),
      ...checkContrast(),
      ...checkFocusOutline()
    ];

    // Count by rule type
    const counts = allIssues.reduce((acc, it) => {
      acc[it.type] = (acc[it.type] || 0) + 1;
      return acc;
    }, {});

    // ✅ FIXED: bracket typo on acc[it.severity]
    const countsBySeverity = allIssues.reduce((acc, it) => {
      const sev = it.severity || 'low';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    // Normalize payload for popup
    const issues = allIssues.map(it => ({
      type: it.type,
      selector: it.selector || null,
      example: it.example || null,
      plainTitle: it.plainTitle,
      plainWhy: it.plainWhy,
      plainFix: it.plainFix,
      severity: it.severity || 'low',
      groupTitle: it.groupTitle,
      wcag: it.wcag
    }));

    sendResponse({ counts, countsBySeverity, issues });
    return true;
  }

  if (msg?.type === 'HIGHLIGHT') {
    const ok = highlight(msg.selector);
    sendResponse({ ok });
    return true;
  }

  return false;
});
