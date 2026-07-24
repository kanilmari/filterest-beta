#!/usr/bin/env node
// ==============================================================================
// fix_go_imports.js: Easelect Go Import Fixer Wrapper
//
// This thin root wrapper keeps the documented `node fix_go_imports.js` entry
// stable while the implementation lives under `server_tools/scripts/`.

require("./server_tools/scripts/fix_go_imports.js");
