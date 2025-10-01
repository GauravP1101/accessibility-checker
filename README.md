# Web Accessibility Checker ♿

<p align="center">

  <!-- Tech stack -->
  <a href="#"><img alt="Chrome Extension" src="https://img.shields.io/badge/Chrome%20Extension-MV3-4285F4?logo=googlechrome&logoColor=white"></a>
  <a href="#"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript&logoColor=black"></a>
  <a href="#"><img alt="HTML" src="https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white"></a>
  <a href="#"><img alt="CSS" src="https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white"></a>
 
  <!-- A11y domains -->
  <a href="#"><img alt="WCAG" src="https://img.shields.io/badge/WCAG-2.1-AA-00A67D?logo=w3c&logoColor=white"></a>
  <a href="#"><img alt="Alt Text" src="https://img.shields.io/badge/Alt%20Text-Images-8B5CF6"></a>
  <a href="#"><img alt="Accessible Names" src="https://img.shields.io/badge/Accessible%20Names-Links%20%26%20Buttons-EC4899"></a>
  <a href="#"><img alt="Form Labels" src="https://img.shields.io/badge/Form%20Labels-Inputs-F97316"></a>
  <a href="#"><img alt="Contrast" src="https://img.shields.io/badge/Contrast-1.4.3-4B5563"></a>
  <a href="#"><img alt="Focus Visible" src="https://img.shields.io/badge/Focus%20Visible-2.4.7-22C55E"></a>
  <a href="#"><img alt="Language of Page" src="https://img.shields.io/badge/Language%20of%20Page-3.1.1-06B6D4"></a>

</p>


A lightweight **Chrome (Manifest V3) extension** that scans the current page for common accessibility issues and explains them in **plain English** with clear fixes.  

It helps developers, designers, and testers quickly spot issues like missing alt text, poor color contrast, unlabeled form fields, and more. You can **filter by severity**, **highlight elements**, and **export reports** as CSV or JSON.

<p align="center">
  <img src="docs/UI.png" alt="Extension popup UI showing grouped issues" width="400">
</p>

---

## ✨ Features
- 🔎 **One-click scan** of any web page  
- 🗂️ **Grouped issues** (Images, Forms, Buttons/Links, Contrast, Focus, Page Settings)  
- 🚦 **Severity filters** (High / Medium / Low)  
- 💬 **Plain-English explanations** — *Why it matters* + *How to fix*  
- 🎯 **Click-to-highlight** problem elements directly on the page  
- 📤 **Export reports** to **CSV** (for QA/design/PM) and **JSON** (for dev/CI use)  
- 🎨 **Compact UI** with modular CSS (base, components, theme)  
- ☀️ Optional **light theme** (`body.light` toggle)  

---

## 🔍 What it checks (WCAG 2.x)
- **Image alt text** — 1.1.1  
- **Links/Buttons accessible name** — 4.1.2  
- **Form inputs labeled** — 3.3.2  
- **Color contrast** (text vs background) — 1.4.3 (AA heuristic)  
- **Visible keyboard focus** — 2.4.7  
- **Page language set (`<html lang>` )** — 3.1.1  

⚠️ *Note: Contrast checks are heuristic based on computed styles. Shadow DOM/iframes may be partially supported. This tool is an **aid**, not a certification.*  

---

## 🛠️ Installation (Developer Mode)
1. Clone or [download this repo](https://github.com/<your-username>/<repo-name>).
2. Go to `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension → click it → **Scan this page**.

---

## 🧪 Test Pages
Try scanning these known accessibility test pages:
- **W3C BAD demo (before/after)**  
  - Bad: https://www.w3.org/WAI/demos/bad/before/home.html  
  - Fixed: https://www.w3.org/WAI/demos/bad/after/home.html  
- **Deque Mars demo**: https://dequeuniversity.com/demo/mars/  
- **WebAIM sample**: https://webaim.org/resources/evalsample/  
- **Page missing `lang`**: https://csstestsuite.github.io/tests/css21_bis/html4/002.html  

---

## 📁 Project Structure
```
accessibility-checker/
├─ manifest.json # Extension config (MV3)
├─ popup.html # UI markup
├─ popup.js # Popup logic (filters, export, highlight)
├─ content.js # Page checks (alt text, contrast, labels, etc.)
└─ styles/
├─ base.css # Base styling
├─ components.css # UI components
└─ theme.css # Dark/Light theme support
```
---

## 📤 Export Formats
- **CSV** (spreadsheet-friendly):  
- **JSON**: Raw structured output (ideal for CI pipelines).

---

## 🚀 Roadmap
- Suggest nearest **AA-compliant colors** for contrast issues  
- **Ignore list / Mark resolved** option  
- Add **heading hierarchy & skip-link checks**  
- Export only **filtered issues**  
- Optional integration with **axe-core** for deeper rules  

---

## 🔐 Privacy
- 100% client-side.  
- The extension **does not collect or transmit data**.  
- All analysis runs locally in your browser on the active page.  

## 📄 License
[MIT](LICENSE) © 2025

---
