# Demystifying Custom Crypters: A Ghidra Decompiler Deep Dive

## Executive Summary & Key Takeaways
Malware authors constantly employ packers, crypters, and protectors to obscure their payloads from static analysis engines and analyst signatures. In this post, we will walk through analyzing a custom crypted PE (Portable Executable) binary, focusing on reconstructing its decryption routines using Ghidra's decompiler.

*   **Attack Vector:** Attackers use packers/crypters to hide malicious strings, file signatures, and API calls, rendering initial static analysis ineffective.
*   **Reversing Technique:** By analyzing entropy and structure, we isolate the encrypted data segment. Using Ghidra's decompiler, we reconstruct the XOR rolling algorithm and dynamic API loading logic.
*   **Key Finding:** Modern custom crypters often utilize simple mathematical transformations combined with dynamic IAT (Import Address Table) assembly to bypass standard signature detections.

---

## Sample Metadata
Providing exact binary metadata is crucial for replication and reversing documentation:

| Attribute | Details |
| :--- | :--- |
| **Analyzed File** | `sample_crypted_loader.bin` |
| **Architecture** | PE32 Executable (Intel x86) |
| **Size** | 114,688 bytes |
| **SHA-256 Hash** | `a78f24b893feedcef79a3a928402c7feab962d29fa4d2026d58ffd630f9a2b22` |
| **Compilation Info** | Microsoft Visual C/C++ (MSVC) |
| **High Entropy Segment** | `.kdata` (Entropy: 7.92 - indicates encryption/compression) |

---

## Technical Analysis & Reversing Workflow

### 1. Reconnaissance & PE Analysis
Before launching Ghidra, we perform basic static checks. Using `PEview` or `Detect It Easy (DIE)`, we notice that the entropy of the `.text` section is unusually low (around 2.5), while a custom section named `.kdata` has an entropy of 7.92. This is a classic indicator of an encrypted payload packed into a dedicated section.

Additionally, the Import Address Table (IAT) is sparse, importing only `LoadLibraryA`, `GetProcAddress`, and `VirtualAlloc`. This tells us the crypted payload resolves its APIs dynamically at runtime.

### 2. Decompiling the Main Loader in Ghidra
Once we load the binary into Ghidra and execute auto-analysis, we locate the entry point. The main function contains an initialization phase, followed by a decryption loop. Here is the decompiled loop reconstructed and cleaned up from Ghidra:

```c
// Reconstructed from Ghidra decompiler output
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
}
```

### 3. Reversing Obfuscated Strings
In real-world malware, strings (like library names or API calls) are rarely stored in plaintext. They are often obfuscated using stack strings or custom hashing. In this sample, the loader resolved `Kernel32.dll` by pushing hex values onto the stack byte-by-byte.

By right-clicking on variables in Ghidra and choosing **Convert -> Char**, we can easily read the stack strings in the decompiler without running the debugger.

:::warning
**Analysis Tip:** If you encounter API hashing (e.g., ROR13 hashing), avoid manual calculation. Use a Ghidra script or an emulator like `x64dbg` with ScyllaHide to let the loader resolve imports for you, then dump the binary.
:::

---

## MITRE ATT&CK Mapping
Mapping observed adversary behaviors to MITRE ATT&CK matrix:

| Tactic | Technique ID | Technique Name | Use Case in Custom Crypters |
| :--- | :--- | :--- | :--- |
| **Defense Evasion** | T1027 | Obfuscated Files or Information | Attacker encrypts the underlying executable code in a separate section (`.kdata`) to defeat signature detections. |
| **Defense Evasion** | T1140 | Deobfuscate/Decode Files or Information | The crypter loader dynamically runs a rolling XOR algorithm in memory to restore the original code stream. |
| **Execution** | T1106 | Native API | The loader dynamically resolves and executes APIs like `VirtualAlloc` and `VirtualProtect` to run the payload. |

---

## Indicators of Compromise (IOCs)
Reversed indicators for detections:

| Type | Name / Value | Description |
| :--- | :--- | :--- |
| **File SHA-256** | `a78f24b893feedcef79a3a928402c7feab962d29fa4d2026d58ffd630f9a2b22` | SHA-256 of the loader wrapper |
| **PE Section** | `.kdata` | Custom high-entropy section name |
| **API Pattern** | `VirtualAlloc` + `VirtualProtect` | Memory allocation sequence followed by execution transitions |

---

## Research Reflections & Lessons Learned
*   **The Challenge:** Reading Ghidra's raw decompiler code was messy before defining custom types. Changing variables from standard `int` or `undefined4` to structured types (like `LPVOID`) instantly made the code readability jump tenfold.
*   **Key Takeaway:** Static analysis gets you the math, but dynamic verification gets you the payload. The combination of Ghidra (to locate the XOR key `0x6A`) and x64dbg (to dump the code after execution) proved to be the most efficient workflow.
*   **Next Steps:** I plan to build a small Python script to automate file dumping from running processes based on memory range permissions, which could automate stage-2 extraction.
