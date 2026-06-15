# Inside the Kernel — Brand Guidelines

This document outlines the brand guidelines, writing principles, and visual identity for **Inside the Kernel**, a cybersecurity-focused technical blog created by Anish Anandhan A L.

---

## 🎯 Purpose & Mission
To document a genuine learning journey through practical cybersecurity research and experimentation. The goal is to build a public record of growth as a cybersecurity practitioner while helping others learn from real-world experiments, projects, and research.

* **Guiding Philosophy:** *Learn. Analyze. Defend.*
* **Tone:** Professional, curious, technically accurate, and educational.
* **Persona:** A practitioner learning in public, exploring real-world problems, documenting methodologies, and sharing lessons learned (not an all-knowing expert).

---

## 👥 Target Audience
* Cybersecurity students
* Reverse engineering enthusiasts
* Malware analysts
* Detection engineers
* Blue team practitioners
* Security researchers
* Recruiters and hiring managers evaluating technical depth

---

## 📑 Core Topics
* **Vulnerable Driver Research** & **Bring Your Own Vulnerable Driver (BYOVD)** techniques
* **Reverse Engineering** & **Malware Analysis**
* **Windows Internals** & **Practical Defensive Security**
* **Detection Engineering**, **Splunk**, and **Sigma Rules**
* **Security Labs & Experiments** (Ghidra Workflows, Static & Dynamic Analysis)
* **Security Hackathon Learnings**

---

## ✍️ Writing Principles
1. **Document Actual Experiences:** Focus on real projects and experiments. Avoid generic cybersecurity content.
2. **Explain the "Why" and "How":** Elaborate on the problem, methodology, challenges, and lessons learned.
3. **Be Transparent:** Share mistakes, dead ends, and limitations openly.
4. **Prioritize Education:** Value technical depth and educational content over sensationalism.
5. **Safety First:** Never include offensive instructions or harmful exploitation guidance. Focus strictly on defensive understanding and research.

---

## 📄 Article Structure (Professional Hybrid Format)
Every article should follow this structure to balance threat research rigor with portfolio reflections:

1. **Executive Summary & Key Takeaways**
   - High-level overview of the threat, malware family, or vulnerability, and 2-3 key findings.
2. **Sample Metadata & Environment**
   - For file/binary/driver analyses: File Name, Size, Architecture, and SHA-256 hash.
3. **Technical Deep-Dive / Analysis**
   - Static analysis (imports, strings), Dynamic analysis (process creation, file/registry modifications), or Reverse Engineering (Ghidra decompiled code blocks).
4. **MITRE ATT&CK Mapping**
   - A standard table mapping the observed adversary behaviors to the MITRE ATT&CK matrix tactics and technique IDs.
5. **Detection Engineering & Mitigations**
   - Actionable detection logic: copy-pasteable Sigma rules, Splunk SPL queries, YARA rules, or GPO mitigations.
6. **Indicators of Compromise (IOCs)**
   - Clear tables/lists detailing host and network artifacts (file hashes, service names, file paths, registry keys).
7. **Research Reflections & Lessons Learned**
   - Direct personal reflections: challenges encountered, personal breakthroughs, and future paths for research.
8. **Educational Disclaimer**
   - A defensive boundaries notification to prevent misuse.

---

## 🎨 Brand & Visual Identity
* **Publication Name:** Inside the Kernel
* **Tagline:** *"Practical write-ups on reverse engineering, vulnerable driver research, malware analysis, and detection engineering."*
* **Visual Style:**
  * Dark theme
  * Minimalist design
  * Professional cybersecurity aesthetic (e.g., hacker/terminal vibes with high-contrast, clean elements)
  * Technical diagrams and screenshots
  * Clean typography
  * Cover images inspired by malware analysis and reverse engineering workflows

---

## 🧑‍💻 About the Author
**Anish Anandhan A L** is a Software Engineering student at VIT Chennai with a strong interest in cybersecurity. Through *Inside the Kernel*, he documents his journey in malware analysis, reverse engineering, vulnerable driver research, detection engineering, and security experimentation.
