import fs from 'fs';
import path from 'path';

const API_DIR = '/home/z/my-project/src/app/api';
const SKIP_ROUTES = ['/api/version'];

// Cache-Control header value to set
const CACHE_CONTROL_VALUE = 'no-store, no-cache, must-revalidate';
const HEADERS_INIT = `  const headers = new Headers();\n  headers.set('Cache-Control', '${CACHE_CONTROL_VALUE}');\n`;

function findRouteFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      results.push(fullPath);
    }
  }
  return results;
}

function getRoutePath(filePath) {
  const idx = filePath.indexOf('/src/app/api');
  return filePath.substring(idx + '/src/app'.length);
}

function hasGetHandler(content) {
  return /export\s+(async\s+)?function\s+GET/.test(content);
}

function isSkipRoute(filePath) {
  for (const skip of SKIP_ROUTES) {
    if (filePath.includes(skip.split('/').pop()) && filePath.includes(skip.split('/')[skip.split('/').length - 2])) {
      // More precise: check the full path
    }
  }
  // Simple check
  return filePath.includes('/api/version/route.ts');
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!hasGetHandler(content)) {
    return { filePath, modified: false, reason: 'No GET handler' };
  }
  
  if (isSkipRoute(filePath)) {
    return { filePath, modified: false, reason: 'Skip route' };
  }

  const originalContent = content;
  const routePath = getRoutePath(filePath);

  // Check if this file already has our exact Cache-Control pattern
  if (content.includes("'Cache-Control', 'no-store, no-cache, must-revalidate'")) {
    return { filePath, modified: false, reason: 'Already has the exact Cache-Control' };
  }

  // ─── STRATEGY ───
  // We need to:
  // 1. Add `const headers = new Headers(); headers.set('Cache-Control', '...');` at the beginning of GET
  // 2. Modify all NextResponse.json() / Response.json() calls in the GET handler to include headers
  // 3. For existing Cache-Control headers, replace them
  // 4. For existing non-Cache-Control headers, merge them with our headers

  // ─── Step 1: Handle files with Cache-Control header constants ───
  // Replace Cache-Control values in const objects like:
  // const LEADERBOARD_CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=10, ...', ... };
  
  // Pattern: 'Cache-Control': 'anything' (in const declarations or inline)
  // Replace all existing Cache-Control values with our value
  
  // First, handle const HEADER objects that contain Cache-Control
  // We'll replace Cache-Control values in those constants
  content = content.replace(
    /'Cache-Control':\s*'[^']*'/g,
    `'Cache-Control': '${CACHE_CONTROL_VALUE}'`
  );

  // Also handle "Cache-Control": "..." (double quotes)
  content = content.replace(
    /"Cache-Control":\s*"[^"]*"/g,
    `'Cache-Control': '${CACHE_CONTROL_VALUE}'`
  );

  // Handle response.headers.set('Cache-Control', '...')
  content = content.replace(
    /response\.headers\.set\('Cache-Control',\s*'[^']*'\)/g,
    `response.headers.set('Cache-Control', '${CACHE_CONTROL_VALUE}')`
  );

  // ─── Step 2: For files WITHOUT existing Cache-Control headers in their GET handler ───
  // Add the headers initialization and modify NextResponse.json calls

  // Check if the GET handler already has Cache-Control (after our replacements above)
  const getHandlerMatch = content.match(/export\s+(async\s+)?function\s+GET\s*\([^)]*\)\s*\{/);
  if (!getHandlerMatch) {
    return { filePath, modified: content !== originalContent, reason: 'No GET handler found after checks' };
  }

  // Check if the file still needs headers init added
  // If after step 1, the file still doesn't have Cache-Control in the GET handler body,
  // we need to add it.
  
  // Find the GET handler body to check if it already has Cache-Control
  const getHandlerStart = content.indexOf(getHandlerMatch[0]) + getHandlerMatch[0].length;
  
  // Find a reasonable end for the GET handler (simplified - look for next export or end of file)
  const nextExportMatch = content.substring(getHandlerStart).match(/\nexport\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/);
  const getHandlerEnd = nextExportMatch ? getHandlerStart + nextExportMatch.index : content.length;
  const getHandlerBody = content.substring(getHandlerStart, getHandlerEnd);

  const hasCacheControlInGet = getHandlerBody.includes("'Cache-Control'") || 
                                 getHandlerBody.includes('"Cache-Control"') ||
                                 getHandlerBody.includes('Cache-Control');

  if (!hasCacheControlInGet) {
    // Need to add headers init at the beginning of GET handler
    // and modify NextResponse.json calls

    // Add headers initialization right after the opening brace of the GET handler
    // Find the first non-whitespace, non-comment line after the opening brace
    
    const insertPoint = getHandlerStart;
    
    // Find where to insert - right after the opening {
    // We want to insert after any existing variable declarations at the top
    // For simplicity, insert right after the opening {
    
    // Actually, let's find the right insertion point:
    // After the opening {, skip any blank lines, then insert
    let insertIdx = insertPoint;
    // Skip whitespace/newlines after {
    while (insertIdx < content.length && /\s/.test(content[insertIdx])) {
      insertIdx++;
    }
    
    // Insert the headers init
    content = content.substring(0, insertPoint) + '\n' + HEADERS_INIT + content.substring(insertPoint);

    // Now we need to modify NextResponse.json() calls in the GET handler
    // Recalculate positions since we added content
    const newGetHandlerMatch = content.match(/export\s+(async\s+)?function\s+GET\s*\([^)]*\)\s*\{/);
    if (!newGetHandlerMatch) {
      return { filePath, modified: false, reason: 'Lost GET handler after insertion' };
    }
    
    const newGetHandlerStart = content.indexOf(newGetHandlerMatch[0]) + newGetHandlerMatch[0].length;
    const newNextExportMatch = content.substring(newGetHandlerStart).match(/\nexport\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/);
    const newGetHandlerEnd = newNextExportMatch ? newGetHandlerStart + newNextExportMatch.index : content.length;
    const handlerContent = content.substring(newGetHandlerStart, newGetHandlerEnd);

    // Process NextResponse.json() calls in the handler
    // Pattern 1: NextResponse.json(data) → NextResponse.json(data, { headers })
    // Pattern 2: NextResponse.json(data, { status: N }) → NextResponse.json(data, { status: N, headers })
    // Pattern 3: NextResponse.json(data, { ... existing opts }) → add headers to existing opts
    // Pattern 4: Response.json(data) → Response.json(data, { headers }) (for auth/me)
    // Pattern 5: Response.json(data, { status: N }) → Response.json(data, { status: N, headers })

    // We'll use regex replacements on the handler content only
    let newHandlerContent = handlerContent;

    // Pattern 1: NextResponse.json(something) without second arg
    // Match: NextResponse.json( ... ) where the content between parens doesn't contain { after a comma
    // This is tricky - let's match common patterns
    // NextResponse.json({ ... }) - single arg
    // NextResponse.json(variable) - single arg
    
    // Replace NextResponse.json(X) where X is not followed by a comma+object
    // We need to be careful not to match calls that already have a second arg
    
    // Simple approach: replace patterns we know
    
    // Pattern: NextResponse.json({ ... }) → NextResponse.json({ ... }, { headers })
    // This handles the case where the first arg is an object literal on one line
    newHandlerContent = newHandlerContent.replace(
      /NextResponse\.json(\s*\(\s*\{[^}]*\}\s*\)\s*[,;]?)/g,
      (match) => {
        if (match.includes(', { headers') || match.includes(',{ headers') || match.includes(', {headers')) {
          return match; // Already has headers
        }
        // Check if there's already a second argument
        // Simple check: if there's a comma after the first } and before the closing )
        const innerMatch = match.match(/NextResponse\.json\s*\(\s*(\{[^}]*\})\s*(,\s*\{[^}]*\})?\s*\)/);
        if (innerMatch && innerMatch[2]) {
          // Already has a second arg - add headers to it
          const secondArg = innerMatch[2];
          if (secondArg.includes('headers')) {
            return match; // Already has headers
          }
          // Add headers to the existing second arg
          return match.replace(
            /NextResponse\.json\s*\(\s*\{[^}]*\}\s*,\s*\{/,
            `NextResponse.json({ ... }, { headers, `
          );
        }
        // No second arg - add one
        return match.replace(
          /\)\s*$/,
          ', { headers })'
        );
      }
    );

    // Hmm, this regex approach is getting too complex and fragile.
    // Let me take a completely different approach.
  }

  if (content === originalContent) {
    return { filePath, modified: false, reason: 'No changes needed' };
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath, modified: true };
}

// Actually, the regex approach above is too fragile for reliable code transformation.
// Let me take a simpler, more targeted approach.

function transformFileV2(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  if (!hasGetHandler(content)) {
    return { filePath, modified: false, reason: 'No GET handler' };
  }
  
  if (isSkipRoute(filePath)) {
    return { filePath, modified: false, reason: 'Skip route (/api/version)' };
  }

  const routePath = getRoutePath(filePath);
  console.log(`\nProcessing: ${routePath}`);

  // ─── PHASE 1: Replace all existing Cache-Control values ───
  
  // In const declarations: 'Cache-Control': '...'
  let before = content;
  content = content.replace(
    /'Cache-Control':\s*'[^']*'/g,
    `'Cache-Control': '${CACHE_CONTROL_VALUE}'`
  );
  if (content !== before) console.log('  → Replaced Cache-Control in const/string literals');

  // Double quotes
  before = content;
  content = content.replace(
    /"Cache-Control":\s*"[^"]*"/g,
    `'Cache-Control': '${CACHE_CONTROL_VALUE}'`
  );
  if (content !== before) console.log('  → Replaced Cache-Control in double-quoted strings');

  // response.headers.set('Cache-Control', '...')
  before = content;
  content = content.replace(
    /\.headers\.set\('Cache-Control',\s*'[^']*'\)/g,
    `.headers.set('Cache-Control', '${CACHE_CONTROL_VALUE}')`
  );
  if (content !== before) console.log('  → Replaced Cache-Control in headers.set()');

  // ─── PHASE 2: Check if GET handler still needs headers ───
  // After Phase 1, some files may already have the correct Cache-Control.
  // We need to check if the GET handler body has Cache-Control.
  // If not, we need to add the headers init and modify responses.

  // Extract GET handler boundaries
  const getMatch = content.match(/export\s+(async\s+)?function\s+GET\s*\([^)]*\)\s*\{/);
  if (!getMatch) {
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { filePath, modified: true };
    }
    return { filePath, modified: false, reason: 'No GET handler match' };
  }

  const getStartIdx = content.indexOf(getMatch[0]);
  const afterGetOpenBrace = getStartIdx + getMatch[0].length;

  // Find end of GET handler - look for next export function or end of file
  const afterGet = content.substring(afterGetOpenBrace);
  const nextExport = afterGet.match(/\nexport\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/);
  const getEndIdx = nextExport ? afterGetOpenBrace + nextExport.index : content.length;

  const getBody = content.substring(afterGetOpenBrace, getEndIdx);
  
  // Check if GET body already has Cache-Control (from Phase 1 or pre-existing)
  const getHasCacheControl = getBody.includes("'Cache-Control'") || 
                              getBody.includes('"Cache-Control"') ||
                              getBody.includes('Cache-Control');

  if (getHasCacheControl) {
    // GET handler already has Cache-Control - just save and return
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('  → Already has Cache-Control (updated value)');
      return { filePath, modified: true };
    }
    return { filePath, modified: false, reason: 'Already has Cache-Control' };
  }

  // ─── PHASE 3: Add headers initialization and modify response calls ───
  
  // Add headers init at the beginning of GET handler
  // We insert right after the opening { of the GET function
  const headersInitCode = `\n  const headers = new Headers();\n  headers.set('Cache-Control', '${CACHE_CONTROL_VALUE}');\n`;
  
  content = content.substring(0, afterGetOpenBrace) + headersInitCode + content.substring(afterGetOpenBrace);
  console.log('  → Added headers initialization');

  // Now modify NextResponse.json() calls in the GET handler
  // Recalculate positions
  const newGetMatch = content.match(/export\s+(async\s+)?function\s+GET\s*\([^)]*\)\s*\{/);
  const newGetStartIdx = content.indexOf(newGetMatch[0]);
  const newAfterGetOpenBrace = newGetStartIdx + newGetMatch[0].length;
  const newAfterGet = content.substring(newAfterGetOpenBrace);
  const newNextExport = newAfterGet.match(/\nexport\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/);
  const newGetEndIdx = newNextExport ? newAfterGetOpenBrace + newNextExport.index : content.length;

  const newGetBody = content.substring(newAfterGetOpenBrace, newGetEndIdx);

  // Process the GET handler body
  let processedBody = newGetBody;
  let responseCount = 0;

  // Pattern: return NextResponse.json(X)  →  return NextResponse.json(X, { headers })
  // Where X is the first argument and there's no second argument
  // We need to handle various X formats:
  //   - { key: value }
  //   - { key: value, ... } (multi-line)
  //   - variable
  //   - { ... } with nested objects
  
  // Approach: Find all NextResponse.json( and Response.json( calls in the GET body
  // For each, determine if it has a second argument
  // If not, add { headers }
  // If it has a second arg (like { status: N }), add headers to it

  // Let's use a more robust approach - find each call and process it
  
  function processJsonCalls(body) {
    let result = body;
    
    // Find all NextResponse.json( and Response.json( positions
    const callPattern = /(NextResponse|Response)\.json\s*\(/g;
    let match;
    const calls = [];
    
    while ((match = callPattern.exec(body)) !== null) {
      calls.push({
        start: match.index,
        callStart: match.index + match[0].length,
        prefix: match[0]
      });
    }

    // Process calls in reverse order to maintain positions
    for (let i = calls.length - 1; i >= 0; i--) {
      const call = calls[i];
      
      // Find the matching closing parenthesis
      // We need to count nested parens
      let depth = 1;
      let pos = call.callStart;
      while (pos < body.length && depth > 0) {
        if (body[pos] === '(') depth++;
        else if (body[pos] === ')') depth--;
        else if (body[pos] === "'" || body[pos] === '"' || body[pos] === '`') {
          // Skip string literals
          const quote = body[pos];
          pos++;
          while (pos < body.length && body[pos] !== quote) {
            if (body[pos] === '\\') pos++; // Skip escaped chars
            pos++;
          }
        }
        pos++;
      }
      
      const callEnd = pos; // Position after the closing )
      const innerContent = body.substring(call.callStart, pos - 1); // Content between ( and )
      
      // Determine if there's a second argument
      // We need to find the comma separating first and second args at depth 0
      let depth2 = 0;
      let braceDepth = 0;
      let firstArgEnd = -1;
      let inString = false;
      let stringChar = '';
      
      for (let j = 0; j < innerContent.length; j++) {
        const ch = innerContent[j];
        
        if (inString) {
          if (ch === '\\') { j++; continue; }
          if (ch === stringChar) inString = false;
          continue;
        }
        
        if (ch === "'" || ch === '"' || ch === '`') {
          inString = true;
          stringChar = ch;
          continue;
        }
        
        if (ch === '(' || ch === '[') depth2++;
        else if (ch === ')' || ch === ']') depth2--;
        else if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        else if (ch === ',' && depth2 === 0 && braceDepth === 0) {
          firstArgEnd = j;
          break;
        }
      }
      
      if (firstArgEnd === -1) {
        // No second argument - add one
        // Insert before the closing )
        const insertPos = call.callStart + innerContent.length;
        result = result.substring(0, insertPos) + ', { headers }' + result.substring(insertPos);
        responseCount++;
      } else {
        // Has a second argument - check if it already has headers
        const secondArg = innerContent.substring(firstArgEnd + 1).trim();
        
        if (secondArg.includes('headers')) {
          // Already has headers - skip
          continue;
        }
        
        // Check if second arg starts with { 
        if (secondArg.startsWith('{')) {
          // Add headers to the existing object
          // Insert 'headers, ' after the opening {
          const secondArgStartInInner = firstArgEnd + 1;
          // Find the { in the second arg
          const bracePos = innerContent.indexOf('{', secondArgStartInInner);
          if (bracePos !== -1) {
            const insertPos = call.callStart + bracePos + 1;
            result = result.substring(0, insertPos) + ' headers, ' + result.substring(insertPos);
            responseCount++;
          }
        } else {
          // Second arg is something else (variable, etc.) - wrap it
          // This is rare, skip for now
          console.log('  ⚠ Second arg is not an object, skipping');
        }
      }
    }
    
    return result;
  }

  processedBody = processJsonCalls(newGetBody);
  
  if (responseCount > 0) {
    console.log(`  → Modified ${responseCount} response calls to include headers`);
  }

  // Reconstruct the file content
  content = content.substring(0, newAfterGetOpenBrace) + processedBody + content.substring(newGetEndIdx);

  // ─── PHASE 4: Handle new NextResponse() calls ───
  // Pattern: new NextResponse(body, { headers: { ... } })
  // We need to add/replace Cache-Control in the headers object
  // This was already handled in Phase 1 for existing Cache-Control
  // For new NextResponse without Cache-Control, we need to add it

  // Check for new NextResponse( calls that have headers but no Cache-Control
  // This pattern is rare (only /api/club-logo uses it, and it already has Cache-Control from Phase 1)

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { filePath, modified: true };
  }
  
  return { filePath, modified: false, reason: 'No changes needed' };
}

// ─── Main ───
const routeFiles = findRouteFiles(API_DIR);
console.log(`Found ${routeFiles.length} route files\n`);

const results = [];
for (const file of routeFiles) {
  try {
    const result = transformFileV2(file);
    results.push(result);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
    results.push({ filePath: file, modified: false, reason: `Error: ${error.message}` });
  }
}

console.log('\n\n═══════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════\n');

const modified = results.filter(r => r.modified);
const skipped = results.filter(r => !r.modified);

console.log(`Modified: ${modified.length} files`);
console.log(`Skipped: ${skipped.length} files\n`);

console.log('Modified files:');
for (const r of modified) {
  console.log(`  ✓ ${getRoutePath(r.filePath)}`);
}

console.log('\nSkipped files:');
for (const r of skipped) {
  console.log(`  - ${getRoutePath(r.filePath)}: ${r.reason}`);
}
