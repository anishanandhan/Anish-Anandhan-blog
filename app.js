// --- BLOG POSTS METADATA STORE (NO HTML STRINGS) ---
const blogPosts = [
  {
    id: "byovd-kernel-abuse",
    title: "Bring Your Own Vulnerable Driver (BYOVD): Understanding Kernel-Mode Abuse",
    tag: "Kernel Research",
    tagClass: "kernel",
    date: "June 12, 2026",
    readTime: "10 min read",
    excerpt: "An in-depth analysis of how adversary groups leverage signed, vulnerable drivers to bypass Windows Kernel-Mode Code Signing (KMCS) and execute code in ring 0.",
    bannerText: "RING 0 ABUSE",
    markdownPath: "posts/byovd-kernel-abuse.md"
  },
  {
    id: "ghidra-decompiler-crypters",
    title: "Demystifying Custom Crypters: A Ghidra Decompiler Deep Dive",
    tag: "Reverse Engineering",
    tagClass: "reversing",
    date: "May 28, 2026",
    readTime: "8 min read",
    excerpt: "Reversing a custom packing utility to understand import address table (IAT) obfuscation and dynamic payload decryption mechanisms.",
    bannerText: "GHIDRA DECODE",
    markdownPath: "posts/ghidra-decompiler-crypters.md"
  },
  {
    id: "splunk-sigma-lsass-dumping",
    title: "Writing Robust Splunk & Sigma Detections for LSASS Memory Dumps",
    tag: "Detection Engineering",
    tagClass: "detection",
    date: "May 10, 2026",
    readTime: "7 min read",
    excerpt: "Building resilient Sigma rules that detect LSASS credential dumping techniques via Sysmon Event ID 10 and Event ID 11.",
    bannerText: "LSASS DEFENSE",
    markdownPath: "posts/splunk-sigma-lsass-dumping.md"
  }
];

// --- SPA ROUTING & APP STATE ---
let currentCategory = "all";
let searchQuery = "";

// DOM Elements
const homeView = document.getElementById("home-view");
const articleView = document.getElementById("article-view");
const postsGrid = document.getElementById("posts-grid");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");
const readingProgressBar = document.getElementById("reading-progress");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.querySelector("aside");

// Handle Mobile Menu Toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
    const icon = mobileMenuBtn.querySelector("i");
    if (sidebar.classList.contains("mobile-open")) {
      icon.className = "fas fa-times";
    } else {
      icon.className = "fas fa-bars";
    }
  });
}

// Close sidebar on navigation item click (mobile)
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    sidebar.classList.remove("mobile-open");
    if (mobileMenuBtn) {
      mobileMenuBtn.querySelector("i").className = "fas fa-bars";
    }
  });
});

// Render Post Cards Grid
function renderPosts() {
  postsGrid.innerHTML = "";
  
  const filtered = blogPosts.filter(post => {
    const matchesCategory = currentCategory === "all" || post.tag.toLowerCase() === currentCategory.toLowerCase();
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    postsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted); font-family: var(--font-mono);">
        <i class="fas fa-search-minus" style="font-size: 2.5rem; margin-bottom: 1rem; display: block; color: var(--accent);"></i>
        No articles found matching query.
      </div>
    `;
    return;
  }

  filtered.forEach(post => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.setAttribute("data-id", post.id);
    card.addEventListener("click", () => openArticle(post.id));

    card.innerHTML = `
      <div class="post-banner-placeholder">
        <svg class="post-banner-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50" fill="none"></path>
          <path d="M0,30 Q25,60 50,30 T100,30" fill="none" opacity="0.5"></path>
        </svg>
        <div class="post-banner-text">${post.bannerText}</div>
      </div>
      <div class="post-card-content">
        <div class="post-meta">
          <div class="post-meta-item">
            <i class="far fa-calendar-alt"></i>
            <span>${post.date}</span>
          </div>
          <div class="post-meta-item">
            <i class="far fa-clock"></i>
            <span>${post.readTime}</span>
          </div>
        </div>
        <h3 class="post-card-title">${post.title}</h3>
        <p class="post-card-excerpt">${post.excerpt}</p>
        <div class="post-card-footer">
          <span class="post-tag ${post.tagClass}">${post.tag}</span>
          <span class="post-read-link">
            Read Post <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    `;
    postsGrid.appendChild(card);
  });
}

// Navigation UI Handler: Go to Home
function navigateToHomeUI() {
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.getElementById("nav-home").classList.add("active");
  
  articleView.classList.remove("active");
  setTimeout(() => {
    articleView.style.display = "none";
    homeView.style.display = "block";
    window.scrollTo({ top: 0 });
    readingProgressBar.style.width = "0%";
  }, 200);
}

// Navigation UI Handler: Go to Terminal (scroll to it)
function scrollToTerminalUI() {
  navigateToHomeUI();
  setTimeout(() => {
    const terminalEl = document.querySelector(".terminal-section");
    if (terminalEl) {
      terminalEl.scrollIntoView({ behavior: "smooth" });
    }
  }, 300);
}

// Set hash routes (Routing triggers)
function navigateToHome() {
  window.location.hash = "";
}

function scrollToTerminal() {
  window.location.hash = "terminal";
}

function openArticle(postId) {
  window.location.hash = postId;
}

// Route Dispatcher based on URL Hash
function handleRouting() {
  const hash = window.location.hash;
  
  if (hash === "" || hash === "#" || hash === "#home") {
    navigateToHomeUI();
  } else if (hash === "#terminal") {
    scrollToTerminalUI();
  } else if (hash.startsWith("#")) {
    let postId = hash.substring(1);
    // Strip leading and trailing slashes if present (e.g. #/byovd-kernel-abuse/ -> byovd-kernel-abuse)
    if (postId.startsWith("/")) {
      postId = postId.substring(1);
    }
    if (postId.endsWith("/")) {
      postId = postId.substring(0, postId.length - 1);
    }
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
      openArticleUI(postId);
    } else {
      navigateToHomeUI();
    }
  } else {
    navigateToHomeUI();
  }
}

// Preprocess Markdown custom blocks (e.g. :::info, :::warning)
function preprocessMarkdown(mdText) {
  // Parse :::info ... ::: blocks (robust to CRLF and extra spaces)
  mdText = mdText.replace(/:::info\s*([\s\S]*?)\s*:::/g, (match, content) => {
    return `<div class="callout info">
      <div class="callout-icon"><i class="fas fa-info-circle"></i></div>
      <div class="callout-content">${marked.parse(content.trim())}</div>
    </div>`;
  });

  // Parse :::warning ... ::: blocks (robust to CRLF and extra spaces)
  mdText = mdText.replace(/:::warning\s*([\s\S]*?)\s*:::/g, (match, content) => {
    return `<div class="callout warning">
      <div class="callout-icon"><i class="fas fa-exclamation-circle"></i></div>
      <div class="callout-content">${marked.parse(content.trim())}</div>
    </div>`;
  });

  return mdText;
}

// Post-process HTML DOM to wrap code blocks with copy-buttons
function postProcessArticleDOM(container) {
  const preElements = container.querySelectorAll("pre");
  preElements.forEach(pre => {
    const code = pre.querySelector("code");
    if (!code) return;
    
    // Extract language from class (e.g., "language-cpp")
    let lang = "code";
    const classList = code.className.split(" ");
    const langClass = classList.find(c => c.startsWith("language-"));
    if (langClass) {
      lang = langClass.substring(9);
    }
    
    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";
    
    const header = document.createElement("div");
    header.className = "code-block-header";
    header.innerHTML = `
      <span class="code-block-lang">${lang}</span>
      <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
    `;
    
    // Swap nodes
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

// Educational Disclaimer HTML
const brandDisclaimerHTML = `
  <div class="article-disclaimer">
    <i class="fas fa-exclamation-triangle"></i>
    <div>
      <div class="disclaimer-title">Educational Disclaimer</div>
      <div class="disclaimer-text">This content is published strictly for defensive research and educational purposes. The code snippets, configurations, and reversing methodologies are shared to help security teams, reverse engineers, and malware analysts improve detection engineering and posture validation. Do not attempt to load or execute driver vulnerabilities or exploit techniques on systems without explicit authorization.</div>
    </div>
  </div>
`;

// Navigation UI Handler: Open and Load Specific Article via Fetch
async function openArticleUI(postId) {
  const post = blogPosts.find(p => p.id === postId);
  if (!post) return;

  // Toggle active views
  homeView.style.display = "none";
  articleView.style.display = "block";
  
  // Set temporary loading state
  document.getElementById("article-placeholder").innerHTML = `
    <div style="text-align: center; padding: 5rem; color: var(--text-muted); font-family: var(--font-mono);">
      <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--accent);"></i>
      <p>Fetching kernel writeup payload...</p>
    </div>
  `;

  try {
    const response = await fetch(post.markdownPath);
    if (!response.ok) {
      throw new Error(`Failed to load post: ${response.statusText}`);
    }
    const rawMarkdown = await response.text();
    
    // Compile markdown to HTML
    const preprocessed = preprocessMarkdown(rawMarkdown);
    const parsedHtml = marked.parse(preprocessed);

    // Update article view layout
    const articleContainer = document.getElementById("article-placeholder");
    articleContainer.innerHTML = `
      <div class="article-header">
        <div class="article-meta">
          <div class="post-meta-item">
            <i class="far fa-calendar-alt"></i>
            <span>${post.date}</span>
          </div>
          <div class="post-meta-item">
            <i class="far fa-clock"></i>
            <span>${post.readTime}</span>
          </div>
          <div class="post-meta-item">
            <i class="far fa-user"></i>
            <span>Anish Anandhan A L</span>
          </div>
        </div>
        <h1 class="article-title">${post.title}</h1>
        <div class="article-tags">
          <span class="post-tag ${post.tagClass}">${post.tag}</span>
        </div>
      </div>
      
      <div class="article-banner">
        <div class="article-banner-text">${post.bannerText}</div>
      </div>

      <div class="article-content">
        ${parsedHtml}
        ${brandDisclaimerHTML}
      </div>
    `;

    // Add copy buttons to code blocks
    postProcessArticleDOM(articleContainer);

    setTimeout(() => {
      articleView.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
      updateReadingProgress();
    }, 50);

  } catch (error) {
    console.error(error);
    document.getElementById("article-placeholder").innerHTML = `
      <div style="text-align: center; padding: 5rem; color: #f43f5e; font-family: var(--font-mono);">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>Error: Could not retrieve article payload (${error.message}).</p>
        <button onclick="navigateToHome()" class="back-btn" style="margin-top: 1.5rem;">Return to Feed</button>
      </div>
    `;
    articleView.classList.add("active");
  }
}

// Update Reading Progress Bar
function updateReadingProgress() {
  if (articleView.style.display === "block") {
    const totalHeight = articleView.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    readingProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  } else {
    readingProgressBar.style.width = "0%";
  }
}

// Copy Code Block Handler
function copyCode(buttonElement) {
  const codeBlock = buttonElement.parentElement.nextElementSibling.querySelector("code");
  const originalText = buttonElement.innerHTML;
  
  navigator.clipboard.writeText(codeBlock.innerText).then(() => {
    buttonElement.innerHTML = `<i class="fas fa-check" style="color: var(--accent);"></i> Copied!`;
    buttonElement.style.color = "var(--accent)";
    setTimeout(() => {
      buttonElement.innerHTML = originalText;
      buttonElement.style.color = "";
    }, 2000);
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}

// --- INITIALIZE EVENT LISTENERS ---
// Search logic
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderPosts();
  });
}

// Category filter tabs
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.getAttribute("data-category");
    renderPosts();
  });
});

// Scroll listener for reading progress bar
window.addEventListener("scroll", updateReadingProgress);

// Navigate to Home clicks
document.getElementById("nav-home").addEventListener("click", (e) => {
  e.preventDefault();
  navigateToHome();
});

document.getElementById("nav-terminal").addEventListener("click", (e) => {
  e.preventDefault();
  scrollToTerminal();
});

// Back to Home button in article view
document.getElementById("back-to-blog").addEventListener("click", (e) => {
  e.preventDefault();
  navigateToHome();
});


// --- INTERACTIVE TERMINAL ENGINE ---
const terminalBody = document.getElementById("terminal-body");
const termInput = document.getElementById("term-input");
let commandHistory = [];
let historyIndex = -1;

const terminalWelcomeMessage = `===========================================================
* INSIDE THE KERNEL - INTERACTIVE COMMAND SHELL v1.1.0    *
* Target Host: windows-kernel-research                    *
* Author: Anish Anandhan A L                              *
* Mode: Markdown Compiler Enabled                         *
===========================================================
Type 'help' to display a list of available system commands.
`;

function initTerminal() {
  if (!terminalBody) return;
  terminalBody.innerHTML = `<div class="term-line welcome">${terminalWelcomeMessage}</div>`;
  // Position input line at the bottom without focusing (prevents page jump scroll on load)
  const inputLine = document.querySelector(".term-input-line");
  if (inputLine) {
    terminalBody.appendChild(inputLine);
  }
}

function writeTermLine(text, type = "output") {
  const line = document.createElement("div");
  line.className = `term-line ${type}`;
  line.innerHTML = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function printTermPrompt() {
  const inputLine = document.querySelector(".term-input-line");
  terminalBody.appendChild(inputLine);
  termInput.focus();
}

// Terminal commands handler
function executeCommand(cmdStr) {
  const fullCmd = cmdStr.trim();
  if (fullCmd === "") return;

  commandHistory.push(fullCmd);
  historyIndex = commandHistory.length;

  writeTermLine(`&gt; ${fullCmd}`, "command");

  const args = fullCmd.split(" ");
  const command = args[0].toLowerCase();

  switch (command) {
    case "help":
      writeTermLine(`Available commands:
  - <strong>help</strong>          : Show this assistance menu
  - <strong>ls</strong>            : List files in workspace
  - <strong>cat &lt;file&gt;</strong>     : View content of a file (e.g. bio.txt)
  - <strong>skills</strong>         : View author's technical skills registry
  - <strong>read &lt;id&gt;</strong>       : Read a specific blog post (e.g. read byovd-kernel-abuse)
  - <strong>matrix</strong>         : Initialize matrix stream rain sequence
  - <strong>clear</strong>          : Clear the shell console output`);
      break;

    case "ls":
      writeTermLine(`total 4
-rw-r--r--  1 anish  staff   350B Jun 15 23:38 bio.txt
-rw-r--r--  1 anish  staff   512B Jun 15 23:38 skills.json
drwxr-xr-x  3 anish  staff   102B Jun 15 23:38 posts/`);
      blogPosts.forEach(post => {
        writeTermLine(`  └─ posts/${post.id}.md`, "success");
      });
      break;

    case "cat":
      if (!args[1]) {
        writeTermLine("Error: cat requires an argument. Usage: cat &lt;filename&gt;", "error");
      } else {
        const filename = args[1].toLowerCase();
        if (filename === "bio.txt") {
          writeTermLine(`<strong>Anish Anandhan A L</strong>
Software Engineering Student at VIT Chennai.
Focus areas: Malware Analysis, Reverse Engineering, Vulnerable Driver Research, Windows Internals, and Detection Engineering.
Guiding Philosophy: Learn. Analyze. Defend.`, "success");
        } else if (filename === "skills.json") {
          executeCommand("skills");
        } else if (filename.startsWith("posts/") && filename.endsWith(".md")) {
          // Extract post ID
          const postId = args[1].substring(6, args[1].length - 3);
          executeCommand(`read ${postId}`);
        } else if (filename.startsWith("posts/")) {
          const postId = args[1].substring(6);
          executeCommand(`read ${postId}`);
        } else {
          writeTermLine(`Error: file '${args[1]}' not found.`, "error");
        }
      }
      break;

    case "skills":
      writeTermLine(JSON.stringify({
        "Languages": ["C/C++", "Python", "x86/x64 Assembly", "PowerShell", "SQL"],
        "Security_Research": ["Windows Internals", "Driver Reverse Engineering", "BYOVD Mechanics", "API Hooking"],
        "Defensive_Tools": ["Splunk Enterprise", "Sigma Rule Development", "Sysmon Logging", "YARA Rules"],
        "Analysis_Tools": ["Ghidra", "x64dbg", "PEview", "Sysinternals Suite"]
      }, null, 2).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;"), "success");
      break;

    case "read":
      if (!args[1]) {
        writeTermLine("Error: read requires a post ID. Usage: read &lt;post_id&gt;", "error");
      } else {
        const postId = args[1];
        const post = blogPosts.find(p => p.id === postId);
        if (post) {
          writeTermLine(`Opening article: "${post.title}"...`, "success");
          setTimeout(() => {
            openArticle(postId);
          }, 800);
        } else {
          writeTermLine(`Error: post '${postId}' not found. Type 'ls' to see valid posts.`, "error");
        }
      }
      break;

    case "clear":
      terminalBody.innerHTML = "";
      break;

    case "matrix":
      writeTermLine("Initializing digital rain sequence in terminal background...", "success");
      startMatrixRain();
      break;

    default:
      writeTermLine(`Command not found: ${command}. Type 'help' for support.`, "error");
  }

  printTermPrompt();
}

// Matrix rain logic
let matrixInterval = null;
function startMatrixRain() {
  let canvas = document.getElementById("matrix-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "matrix-canvas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1";
    canvas.style.opacity = "0.15";
    canvas.style.pointerEvents = "none";
    document.querySelector(".terminal-container").appendChild(canvas);
  }

  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  
  const resize = () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  };
  resize();

  const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const alphabet = katakana.split("");

  const fontSize = 14;
  const columns = canvas.width / fontSize;

  const rainDrops = [];
  for (let x = 0; x < columns; x++) {
    rainDrops[x] = 1;
  }

  const draw = () => {
    ctx.fillStyle = "rgba(7, 8, 11, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff9d";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < rainDrops.length; i++) {
      const text = alphabet[Math.floor(Math.random() * alphabet.length)];
      ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

      if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  };

  if (matrixInterval) clearInterval(matrixInterval);
  matrixInterval = setInterval(draw, 30);

  setTimeout(() => {
    stopMatrixRain();
  }, 10000);
}

function stopMatrixRain() {
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }
  const canvas = document.getElementById("matrix-canvas");
  if (canvas) {
    canvas.style.display = "none";
  }
}

// Terminal Inputs & History Browsing
if (termInput) {
  termInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = termInput.value;
      termInput.value = "";
      executeCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        termInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        termInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        termInput.value = "";
      }
    }
  });
}

// On Page Load - Robust DOM ready check to prevent skipped events
function initApp() {
  renderPosts();
  initTerminal();
  handleRouting();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Listen for browser Back/Forward navigation hash changes
window.addEventListener("hashchange", handleRouting);
