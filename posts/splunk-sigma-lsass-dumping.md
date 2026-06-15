Credential dumping remains one of the most common post-exploitation activities. Attackers access the Local Security Authority Subsystem Service (LSASS) memory space to extract plaintext credentials, NTLM hashes, and Kerberos tickets. Tools like Mimikatz, Dumpert, or even the built-in `rundll32.exe comsvcs.dll` execute this technique. In this post, we will construct robust detection logic to intercept these dumping attempts.

## How LSASS Dumping Works (The Windows Internals View)

To extract memory from a process, the dumping tool must open a handle to LSASS (`lsass.exe`) with specific access rights. Specifically, it requires `PROCESS_VM_READ` (0x0010) and `PROCESS_QUERY_INFORMATION` (0x0400). When Sysmon is installed, it logs these handle creations as **Event ID 10: ProcessAccess**.

Additionally, if the tool creates a physical dump file on disk (like Mimikatz writing `lsass.dmp`), Sysmon logs it as **Event ID 11: FileCreate**.

## Detecting lsass.dmp Creation on Disk

A simple yet effective detection checks for common process utilities generating files that match LSASS dump characteristics. Attackers often rename the dump file to hide, but we can look for specific process linkages.

For example, using `rundll32.exe` to dump LSASS memory usually involves invoking the mini-dump function in `comsvcs.dll`. The command line looks like this:

`rundll32.exe C:\windows\System32\comsvcs.dll, MiniDump [LSASS_PID] C:\temp\lsass.dmp full`

## Splunk Search Query

Here is an enterprise-grade Splunk search that correlates process command line arguments and flags suspicious uses of comsvcs.dll:

```splunk
index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational" EventCode=1 (CommandLine="*comsvcs.dll*MiniDump*" OR CommandLine="*comsvcs.dll*,#24*")
| stats count min(_time) as firstTime max(_time) as lastTime by Computer, User, Image, CommandLine, ParentImage
| convert ctime(firstTime) ctime(lastTime)
```

## Sigma Rule for LSASS Process Access

This Sigma rule focuses on the Sysmon Event ID 10 (ProcessAccess). It checks if a suspicious process requests read access to LSASS, ignoring standard system false positives like `taskmgr.exe` or Windows Defender:

```yaml
title: Suspicious Access to LSASS Memory
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
level: high
```

:::info
**Tuning Detections:** In production environments, antivirus agents and credential guard systems will trigger false positives. Ensure you build exclusions for your specific endpoint agents by filtering on their executable path and signing certificate.
:::
