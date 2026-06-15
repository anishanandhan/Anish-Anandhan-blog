Malware authors constantly employ packers, crypters, and protectors to obscure their payloads from static analysis engines and analyst signatures. In this post, we will walk through analyzing a custom crypted PE (Portable Executable) binary, focusing on reconstructing its decryption routines using Ghidra's decompiler.

## Reconnaissance & PE Analysis

Before launching Ghidra, we perform basic static checks. Using `PEview` or `Detect It Easy (DIE)`, we notice that the entropy of the `.text` section is unusually low (around 2.5), while a custom section named `.kdata` has an entropy of 7.92. This is a classic indicator of an encrypted payload packed into a dedicated section.

Additionally, the Import Address Table (IAT) is sparse, importing only `LoadLibraryA`, `GetProcAddress`, and `VirtualAlloc`. This tells us the crypted payload resolves its APIs dynamically at runtime.

## Decompiling the Main Loader in Ghidra

Once we load the binary into Ghidra and execute auto-analysis, we locate the entry point. The main function contains an initialization phase, followed by a decryption loop. Here is the decompiled loop reconstructed from Ghidra:

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

## Reversing Obfuscated Strings

In real-world malware, strings (like library names or API calls) are rarely stored in plaintext. They are often obfuscated using stack strings or custom hashing. In this sample, the loader resolved `Kernel32.dll` by pushing hex values onto the stack byte-by-byte.

By right-clicking on variables in Ghidra and choosing **Convert -> Char**, we can easily read the stack strings in the decompiler without running the debugger.

:::warning
**Analysis Tip:** If you encounter API hashing (e.g., ROR13 hashing), avoid manual calculation. Use a Ghidra script or an emulator like `x64dbg` with ScyllaHide to let the loader resolve imports for you, then dump the binary.
:::

## Key Findings & Next Steps

After the decryption loop completes, the malware executes the payload in the newly allocated memory space. To analyze the next stage, we must perform a dynamic dump:

1. Load the file in a debugger (like `x64dbg`).
2. Set a breakpoint on the call instruction to the decrypted buffer (e.g., `call eax`).
3. Step into the code and use the Scylla plugin to dump the decrypted PE structure.
4. Load the dumped PE into Ghidra for secondary analysis.
