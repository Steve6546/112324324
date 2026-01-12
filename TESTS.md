# File System & Core Tests

## Test Script
Run these tests manually in the browser console to verify core functionality.

---

## Test 1: Multiple Refresh Stability
**Goal:** Verify file count stays constant after 3 refreshes

```javascript
// Run in console after app loads
async function testRefreshStability() {
    const initialCount = await testGetFileCount();
    console.log(`Initial file count: ${initialCount}`);
    
    // Simulate refresh by reloading
    console.log('⏳ Refresh the page 3 times, then run testGetFileCount() each time');
    console.log('Expected: File count should remain ' + initialCount);
}

async function testGetFileCount() {
    const db = await window.indexedDB.open('lovable-db-v2');
    return new Promise((resolve) => {
        const req = indexedDB.open('lovable-db-v2');
        req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const countReq = store.count();
            countReq.onsuccess = () => {
                console.log(`📁 File count: ${countReq.result}`);
                resolve(countReq.result);
            };
        };
    });
}
```

**Pass Criteria:** File count is identical after 3 refreshes

---

## Test 2: Rename File Round-Trip
**Goal:** Rename a file, rename back, verify content preserved

```javascript
// In Editor, create a file named "test.html" with content "Hello World"
// 1. Rename to "renamed.html"
// 2. Rename back to "test.html"
// 3. Check content is still "Hello World"

// Expected: Content preserved, no duplication, no data loss
```

**Pass Criteria:** Content matches original after rename round-trip

---

## Test 3: Path Normalization
**Goal:** Verify invalid paths are rejected

```javascript
// Test in console
import { normalizePath } from './lib/db';

// Should work:
console.log(normalizePath('/test.html')); // /test.html
console.log(normalizePath('test.html'));  // /test.html
console.log(normalizePath('//test//file.html')); // /test/file.html
console.log(normalizePath('/folder/../test.html')); // /test.html

// Should throw:
try { normalizePath(''); } catch(e) { console.log('✅ Empty path rejected'); }
try { normalizePath('..'); } catch(e) { console.log('✅ .. only rejected'); }
try { normalizePath('/  /'); } catch(e) { console.log('✅ Whitespace-only rejected'); }
```

---

## Test 4: Collision Detection
**Goal:** Verify duplicate file creation is rejected

```javascript
// 1. Create "duplicate.html"
// 2. Try to create "duplicate.html" again
// Expected: Error shown, file not duplicated

// Automated test:
async function testCollision() {
    const db = await getDB();
    const projectId = 'test-project';
    
    // First file
    await db.createFile({
        id: 'test1',
        projectId,
        name: 'collision.html',
        path: '/collision.html',
        type: 'file',
        content: 'first',
        language: 'html',
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
    
    // Second file (should fail)
    try {
        await db.createFile({
            id: 'test2',
            projectId,
            name: 'collision.html',
            path: '/collision.html',
            type: 'file',
            content: 'second',
            language: 'html',
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        console.log('❌ FAIL: Duplicate was allowed');
    } catch(e) {
        console.log('✅ PASS: Duplicate rejected with:', e.message);
    }
}
```

---

## Test 5: Debounce Verification
**Goal:** Verify writes are debounced, not on every keystroke

```javascript
// 1. Open a file in editor
// 2. Type rapidly for 5 seconds
// 3. Check console for "[AutoSave]" messages
// Expected: Only see 1-2 AutoSave messages, not one per keystroke

// 4. Wait 1 second after stopping
// Expected: See final "[AutoSave]" message

// 5. Switch to another file immediately after typing
// Expected: See "[Flush]" message - content saved before switch
```

---

## Test 6: Fast File Switching
**Goal:** Verify no content loss on rapid file switching

```javascript
// 1. Open file A, type "AAA"
// 2. Immediately switch to file B (before debounce fires)
// 3. Type "BBB" in file B
// 4. Switch back to file A
// Expected: File A contains "AAA", File B contains "BBB"
// No overwrites, no data loss
```

---

## Test 7: Migration Only Once
**Goal:** Verify legacy projects migrate only once

```javascript
// 1. Create a new project via AI (this sets project.code)
// 2. Open project in Editor (migration happens, check console for "[Migration]")
// 3. Refresh page
// 4. Open same project again
// Expected: NO "[Migration]" message on second open
// Expected: File count same as after first migration
```

---

## Test 8: Delete Confirmation
**Goal:** Verify delete is permanent and intentional

```javascript
// 1. Create a test file
// 2. Click delete
// Expected: Confirmation dialog appears
// 3. Confirm delete
// Expected: File removed, cannot be recovered (no undo)
```

---

## Checklist Summary

| Test | Description | Pass/Fail |
|------|-------------|-----------|
| 1 | 3x Refresh → Same file count | ⬜ |
| 2 | Rename round-trip → Content preserved | ⬜ |
| 3 | Path normalization rejects invalid | ⬜ |
| 4 | Collision detection works | ⬜ |
| 5 | Debounce: Few saves, not per keystroke | ⬜ |
| 6 | Fast file switch → No data loss | ⬜ |
| 7 | Migration runs only once | ⬜ |
| 8 | Delete requires confirmation | ⬜ |

---

## Build Verification

```bash
npm run build
```

**Pass Criteria:**
- ✅ `npm run build` = PASS (no errors)
- ✅ Acceptance tests = PASS (all 8 tests above)
- ✅ No console errors = PASS (check browser console)
