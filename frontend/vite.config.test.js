// vite.config.test.js
// Verifies dev-server routing decisions that run before the SPA bootstraps.
// Bridges Vite root requests, backend auth-mode state, and forced-login redirects.
// Exists so localhost:5173/ mirrors the backend root login-to-browse contract.
// @vitest-environment node

import { describe, expect, test } from 'vitest';
import {
  isRootDocumentRequest,
  shouldRedirectDevRootToStandaloneLogin,
} from './vite.config.mjs';

function request(method, url) {
  return { method, url };
}

describe('vite forced-login root redirect helpers', () => {
  test('matches plain root document GET and HEAD requests only', () => {
    expect(isRootDocumentRequest(request('GET', '/'))).toBe(true);
    expect(isRootDocumentRequest(request('HEAD', '/'))).toBe(true);
    expect(isRootDocumentRequest(request('POST', '/'))).toBe(false);
    expect(isRootDocumentRequest(request('GET', '/login'))).toBe(false);
    expect(isRootDocumentRequest(request('GET', '/service_catalog'))).toBe(false);
  });

  test('keeps explicit SPA auth-entry roots out of the standalone redirect', () => {
    expect(isRootDocumentRequest(request('GET', '/?login-entry=1'))).toBe(false);
    expect(isRootDocumentRequest(request('GET', '/?register-entry=1'))).toBe(false);
  });

  test('redirects only unauthenticated forced-login auth modes', () => {
    expect(shouldRedirectDevRootToStandaloneLogin({
      login_required_for_browse: true,
      needs_button: 'login',
    })).toBe(true);
    expect(shouldRedirectDevRootToStandaloneLogin({
      login_required_for_browse: true,
      needs_button: 'logout',
    })).toBe(false);
    expect(shouldRedirectDevRootToStandaloneLogin({
      login_required_for_browse: false,
      needs_button: 'login',
    })).toBe(false);
    expect(shouldRedirectDevRootToStandaloneLogin(null)).toBe(false);
  });
});
