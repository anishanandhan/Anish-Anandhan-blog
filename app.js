// --- BLOG POSTS DATA STORE ---
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
    content: `
      <p>In modern Windows security architectures, the kernel boundary (Ring 0) is heavily guarded. Windows enforces Kernel-Mode Code Signing (KMCS), ensuring that only drivers cryptographically signed by trusted authorities or Microsoft itself can load into kernel space. However, threat actors have found an elegant, highly effective bypass: <strong>Bring Your Own Vulnerable Driver (BYOVD)</strong>.</p>
      
      <blockquote>
        <strong>BYOVD Concept:</strong> Instead of writing a kernel exploit from scratch or attempting to sign a malicious driver, an attacker installs a legitimate, signed driver that contains a known security flaw (e.g., arbitrary physical memory read/write) and exploits that flaw from user mode (Ring 3) to compromise kernel memory.
      </blockquote>

      <h2>Why This Topic Matters</h2>
      <p>BYOVD attacks are increasingly used by advanced persistent threats (APTs) and ransomware groups (like Lapsus$, BlackByte, and Cuba Ransomware) to disable Endpoint Detection and Response (EDR) agents. EDRs operate with high privileges, but their drivers run in Ring 0. By gaining arbitrary write access in Ring 0, attackers can simply locate the EDR driver's active structures in memory and patch its execution flow or clear its process notification callbacks.</p>

      <h2>Methodology & Exploit Mechanics</h2>
      <p>Most vulnerable drivers expose read/write primitives to user mode through input/output control (IOCTL) codes. When a user-mode application calls <code>DeviceIoControl</code>, the kernel routes the request to the driver's dispatch routine. If the driver fails to validate the buffer addresses or checks, it creates a security loophole.</p>
      
      <p>For example, the vulnerable Micro-Star MSI Ambient Light driver (<code>RTCore64.sys</code>) exposes IOCTLs that read and write physical and virtual memory. Below is a conceptual illustration of how a user-mode application interacts with this primitive:</p>

      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">cpp</span>
          <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code>// Open a handle to the vulnerable driver
HANDLE hDevice = CreateFileW(
    L"\\\\.\\RTCore64",
    GENERIC_READ | GENERIC_WRITE,
    0,
    NULL,
    OPEN_EXISTING,
    FILE_ATTRIBUTE_NORMAL,
    NULL
);

if (hDevice == INVALID_HANDLE_VALUE) {
    printf("[-] Failed to obtain driver handle: %d\\n", GetLastError());
    return;
}

// Struct for RTCore64 read/write operations
struct RT_MEMORY_READ {
    DWORD Address;
    BYTE Size; // 1, 2, or 4 bytes
    DWORD Value;
};

// Reading a kernel virtual address via IOCTL 0x80002048
RT_MEMORY_READ readReq;
readReq.Address = targetKernelAddress;
readReq.Size = 4;
readReq.Value = 0;

DWORD bytesReturned;
BOOL success = DeviceIoControl(
    hDevice,
    0x80002048, // Vulnerable read IOCTL
    &readReq, sizeof(readReq),
    &readReq, sizeof(readReq),
    &bytesReturned,
    NULL
);

if (success) {
    printf("[+] Kernel Data at 0x%08X: 0x%08X\\n", targetKernelAddress, readReq.Value);
}</code></pre>
      </div>

      <h2>Defensive Strategy & Detection</h2>
      <p>Defending against BYOVD is primarily about restricting driver load operations. Here are the core defensive controls:</p>
      <ul>
        <li><strong>Microsoft Vulnerable Driver Blocklist:</strong> Enable driver blocklisting via Windows Defender Application Control (WDAC). This blocks known bad drivers from loading entirely.</li>
        <li><strong>Credential Guard and HVCI:</strong> Hypervisor-Protected Code Integrity (HVCI) uses virtualization-based security to prevent unsigned code injection in kernel memory.</li>
        <li><strong>Sysmon Monitoring:</strong> Monitor Event ID 6 (Driver Loaded) to track driver installations and cross-reference hashes against known vulnerable driver repositories like the LOLDrivers database.</li>
      </ul>

      <div class="callout info">
        <div class="callout-icon"><i class="fas fa-shield-alt"></i></div>
        <div class="callout-content">
          <strong>Detection Tip:</strong> Keep an eye on non-standard drivers being registered by non-system processes. In Splunk, search for Sysmon EventID 6 where the driver path is in <code>C:\\Users\\*</code> or <code>C:\\Windows\\Temp\\*</code>.
        </div>
      </div>

      <h2>Sigma Detection Rule</h2>
      <p>Here is a Sigma rule pattern designed to detect the loading of <code>RTCore64.sys</code> based on its driver name or hash:</p>

      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">yaml</span>
          <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code>title: Vulnerable RTCore64 Driver Load
id: 9a5d5c58-48be-4cc5-9ab3-5c0dbfa11440
status: experimental
description: Detects the load of RTCore64.sys, a frequently abused driver in BYOVD attacks.
author: Anish Anandhan A L
logsource:
    product: windows
    service: sysmon
detection:
    selection_sysmon:
        EventID: 6
    selection_driver:
        ImageLoaded|endswith:
            - '\\RTCore64.sys'
            - '\\RTCore32.sys'
    condition: selection_sysmon and selection_driver
falsepositives:
    - Legitimate MSI utility installations (rare in enterprise servers)
level: high</code></pre>
      </div>

      <div class="article-disclaimer">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <div class="disclaimer-title">Educational Disclaimer</div>
          <div class="disclaimer-text">This content is published strictly for defensive research and educational purposes. The code snippets and conceptual discussions are intended to aid security teams in detection engineering and kernel security posture validation. Do not attempt to load or exploit driver vulnerabilities on systems without explicit authorization.</div>
        </div>
      </div>
    `
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
    content: `
      <p>Malware authors constantly employ packers, crypters, and protectors to obscure their payloads from static analysis engines and analyst signatures. In this post, we will walk through analyzing a custom crypted PE (Portable Executable) binary, focusing on reconstructing its decryption routines using Ghidra's decompiler.</p>
      
      <h2>Reconnaissance & PE Analysis</h2>
      <p>Before launching Ghidra, we perform basic static checks. Using <code>PEview</code> or <code>Detect It Easy (DIE)</code>, we notice that the entropy of the <code>.text</code> section is unusually low (around 2.5), while a custom section named <code>.kdata</code> has an entropy of 7.92. This is a classic indicator of an encrypted payload packed into a dedicated section.</p>
      
      <p>Additionally, the Import Address Table (IAT) is sparse, importing only <code>LoadLibraryA</code>, <code>GetProcAddress</code>, and <code>VirtualAlloc</code>. This tells us the crypted payload resolves its APIs dynamically at runtime.</p>

      <h2>Decompiling the Main Loader in Ghidra</h2>
      <p>Once we load the binary into Ghidra and execute auto-analysis, we locate the entry point. The main function contains an initialization phase, followed by a decryption loop. Here is the decompiled loop reconstructed from Ghidra:</p>

      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">c</span>
          <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code>// Reconstructed from Ghidra decompiler output
undefined4 entry(void) {
  LPVOID encrypted_data_ptr;
  LPVOID allocated_memory;
  uint i;
  byte xor_key;
  
  // Custom encrypted section starts at 0x408000
  encrypted_data_ptr = (LPVOID)0x408000;
  xor_key = 0x6A; // Dynamic XOR key
  
  // Allocate read-write-execute memory for the decrypted payload
  allocated_memory = VirtualAlloc((LPVOID)0x0, 0xC400, 0x3000, 0x40);
  
  if (allocated_memory != (LPVOID)0x0) {
    // Decryption Loop (simple rolling XOR example)
    for (i = 0; i < 0xC400; i = i + 1) {
      *(byte *)((int)allocated_memory + i) = 
        *(byte *)((int)encrypted_data_ptr + i) ^ xor_key ^ (byte)i;
    }
    
    // Cast allocated memory to function pointer and execute payload
    (*(code *)allocated_memory)();
  }
  return 0;
}</code></pre>
      </div>

      <h2>Reversing Obfuscated Strings</h2>
      <p>In real-world malware, strings (like library names or API calls) are rarely stored in plaintext. They are often obfuscated using stack strings or custom hashing. In this sample, the loader resolved <code>Kernel32.dll</code> by pushing hex values onto the stack byte-by-byte.</p>
      
      <p>By right-clicking on variables in Ghidra and choosing <strong>Convert -> Char</strong>, we can easily read the stack strings in the decompiler without running the debugger.</p>

      <div class="callout warning">
        <div class="callout-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="callout-content">
          <strong>Analysis Tip:</strong> If you encounter API hashing (e.g., ROR13 hashing), avoid manual calculation. Use a Ghidra script or an emulator like <code>x64dbg</code> with ScyllaHide to let the loader resolve imports for you, then dump the binary.
        </div>
      </div>

      <h2>Key Findings & Next Steps</h2>
      <p>After the decryption loop completes, the malware executes the payload in the newly allocated memory space. To analyze the next stage, we must perform a dynamic dump:
      <ol>
        <li>Load the file in a debugger (like <code>x64dbg</code>).</li>
        <li>Set a breakpoint on the call instruction to the decrypted buffer (e.g., <code>call eax</code>).</li>
        <li>Step into the code and use the Scylla plugin to dump the decrypted PE structure.</li>
        <li>Load the dumped PE into Ghidra for secondary analysis.</li>
      </ol>
      </p>

      <div class="article-disclaimer">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <div class="disclaimer-title">Educational Disclaimer</div>
          <div class="disclaimer-text">This walkthrough details malware decryption methodologies purely for security research, threat hunting, and educational analysis. The techniques are shared to help detection engineers identify loader patterns and signature-based packing techniques.</div>
        </div>
      </div>
    `
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
    content: `
      <p>Credential dumping remains one of the most common post-exploitation activities. Attackers access the Local Security Authority Subsystem Service (LSASS) memory space to extract plaintext credentials, NTLM hashes, and Kerberos tickets. Tools like Mimikatz, Dumpert, or even the built-in <code>rundll32.exe comsvcs.dll</code> execute this technique. In this post, we will construct robust detection logic to intercept these dumping attempts.</p>

      <h2>How LSASS Dumping Works (The Windows Internals View)</h2>
      <p>To extract memory from a process, the dumping tool must open a handle to LSASS (<code>lsass.exe</code>) with specific access rights. Specifically, it requires <code>PROCESS_VM_READ</code> (0x0010) and <code>PROCESS_QUERY_INFORMATION</code> (0x0400). When Sysmon is installed, it logs these handle creations as <strong>Event ID 10: ProcessAccess</strong>.</p>
      
      <p>Additionally, if the tool creates a physical dump file on disk (like Mimikatz writing <code>lsass.dmp</code>), Sysmon logs it as <strong>Event ID 11: FileCreate</strong>.</p>

      <h2>Detecting lsass.dmp Creation on Disk</h2>
      <p>A simple yet effective detection checks for common process utilities generating files that match LSASS dump characteristics. Attackers often rename the dump file to hide, but we can look for specific process linkages.</p>
      
      <p>For example, using <code>rundll32.exe</code> to dump LSASS memory usually involves invoking the mini-dump function in <code>comsvcs.dll</code>. The command line looks like this:</p>
      
      <code>rundll32.exe C:\\windows\\System32\\comsvcs.dll, MiniDump [LSASS_PID] C:\\temp\\lsass.dmp full</code>

      <h2>Splunk Search Query</h2>
      <p>Here is an enterprise-grade Splunk search that correlates process command line arguments and flags suspicious uses of comsvcs.dll:</p>

      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">splunk</span>
          <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code>index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 (CommandLine="*comsvcs.dll*MiniDump*" OR CommandLine="*comsvcs.dll*,#24*")
| stats count min(_time) as firstTime max(_time) as lastTime by Computer, User, Image, CommandLine, ParentImage
| convert ctime(firstTime) ctime(lastTime)</code></pre>
      </div>

      <h2>Sigma Rule for LSASS Process Access</h2>
      <p>This Sigma rule focuses on the Sysmon Event ID 10 (ProcessAccess). It checks if a suspicious process requests read access to LSASS, ignoring standard system false positives like <code>taskmgr.exe</code> or Windows Defender:</p>

      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">yaml</span>
          <button class="copy-code-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code>title: Suspicious Access to LSASS Memory
id: 5a8a8c1f-4ea6-4cb0-9bbd-e4fb3cc71871
status: stable
description: Detects process access requests to LSASS with VM Read access rights, which indicates credential dumping.
author: Anish Anandhan A L
logsource:
    product: windows
    service: sysmon
detection:
    selection:
        EventID: 10
        TargetImage|endswith: '\\lsass.exe'
        GrantedAccess|contains:
            - '0x10'   # PROCESS_VM_READ
            - '0x1fffff' # PROCESS_ALL_ACCESS
    filter_legitimate:
        SourceImage|endswith:
            - '\\defender.exe'
            - '\\msmpeng.exe'
            - '\\taskmgr.exe'
            - '\\svchost.exe'
    condition: selection and not filter_legitimate
level: high</code></pre>
      </div>

      <div class="callout info">
        <div class="callout-icon"><i class="fas fa-info-circle"></i></div>
        <div class="callout-content">
          <strong>Tuning Detections:</strong> In production environments, antivirus agents and credential guard systems will trigger false positives. Ensure you build exclusions for your specific endpoint agents by filtering on their executable path and signing certificate.
        </div>
      </div>

      <div class="article-disclaimer">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <div class="disclaimer-title">Educational Disclaimer</div>
          <div class="disclaimer-text">This analysis of LSASS memory dumping is shared to provide defenders, detection engineers, and security analysts with the queries and rules required to monitor enterprise Windows systems. Do not use this information for unauthorized credential dumping or unauthorized network security audits.</div>
        </div>
      </div>
    `
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

// Navigation Function: Go to Home
function navigateToHome() {
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

// Navigation Function: Go to Terminal (scroll to it)
function scrollToTerminal() {
  navigateToHome();
  setTimeout(() => {
    document.querySelector(".terminal-section").scrollIntoView({ behavior: "smooth" });
  }, 300);
}

// Navigation Function: Open Specific Article
function openArticle(postId) {
  const post = blogPosts.find(p => p.id === postId);
  if (!post) return;

  // Toggle active views
  homeView.style.display = "none";
  articleView.style.display = "block";
  
  // Update article content
  document.getElementById("article-placeholder").innerHTML = `
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
      ${post.content}
    </div>
  `;

  setTimeout(() => {
    articleView.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateReadingProgress();
  }, 50);
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
* INSIDE THE KERNEL - INTERACTIVE COMMAND SHELL v1.0.4    *
* Target Host: windows-kernel-research                    *
* Author: Anish Anandhan A L                              *
===========================================================
Type 'help' to display a list of available system commands.
`;

function initTerminal() {
  if (!terminalBody) return;
  terminalBody.innerHTML = `<div class="term-line welcome">${terminalWelcomeMessage}</div>`;
  printTermPrompt();
}

function writeTermLine(text, type = "output") {
  const line = document.createElement("div");
  line.className = `term-line ${type}`;
  line.innerHTML = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function printTermPrompt() {
  // Move input line to the bottom
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
      postsGrid.querySelectorAll(".post-card").forEach(card => {
        const id = card.getAttribute("data-id");
        writeTermLine(`  └─ posts/${id}`, "success");
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
  // If canvas doesn't exist, create it inside the terminal container
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
  
  // Set dimensions
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

  // Auto shut down matrix after 10 seconds to save resource
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

// On Page Load
window.addEventListener("DOMContentLoaded", () => {
  renderPosts();
  initTerminal();
});
