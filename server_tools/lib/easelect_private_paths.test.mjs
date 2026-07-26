// easelect_private_paths.test.mjs
// Verifies the Node resolver for native Easelect and independent runtime paths.
// Bridges temporary checkout markers with the one EASELECT_KEY_ROOT override contract.
// Exists to prevent tooling from recreating or depending on root compatibility links.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, test } from 'vitest';
import { resolveEaselectPrivatePaths } from './easelect_private_paths.mjs';

const temporaryRoots = [];

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'easelect-private-paths-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('resolveEaselectPrivatePaths', () => {
  test('resolves a private source checkout outside the repo', () => {
    const root = temporaryRoot();
    const projectRoot = path.join(root, 'easelect');
    const keyRoot = path.join(root, 'protected-keys');
    fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'VERSION_EASELECT'), 'test\n');

    const resolved = resolveEaselectPrivatePaths(projectRoot, {
      EASELECT_KEY_ROOT: keyRoot,
    });

    expect(resolved).toEqual({
      runtimeEnvFile: path.join(
        keyRoot,
        'easelect_development',
        'runtime_environment.env',
      ),
      developmentEnvFile: path.join(
        keyRoot,
        'easelect_development',
        'development_environment.env',
      ),
      tlsCertificateFile: path.join(
        keyRoot,
        'easelect_development',
        'local_tls_certificate',
        'localhost_certificate.crt',
      ),
      tlsPrivateKeyFile: path.join(
        keyRoot,
        'easelect_development',
        'local_tls_certificate',
        'localhost_private_key.key',
      ),
    });
    for (const legacyName of ['.env', 'dev_env.txt', 'dev-cert.crt', 'dev-cert.key']) {
      expect(fs.existsSync(path.join(projectRoot, legacyName))).toBe(false);
    }
  });

  test('keeps generated and deployed runtimes local', () => {
    for (const versionFile of ['VERSION_APP', 'VERSION_EASELECT']) {
      const projectRoot = path.join(temporaryRoot(), versionFile);
      fs.mkdirSync(projectRoot);
      fs.writeFileSync(path.join(projectRoot, versionFile), 'test\n');

      expect(resolveEaselectPrivatePaths(projectRoot, {})).toEqual({
        runtimeEnvFile: path.join(projectRoot, '.env'),
        developmentEnvFile: path.join(projectRoot, 'dev_env.txt'),
        tlsCertificateFile: path.join(projectRoot, 'dev-cert.crt'),
        tlsPrivateKeyFile: path.join(projectRoot, 'dev-cert.key'),
      });
    }
  });

  test('rejects relative and repo-internal overrides', () => {
    const projectRoot = path.join(temporaryRoot(), 'easelect');
    fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'VERSION_EASELECT'), 'test\n');

    expect(() => resolveEaselectPrivatePaths(projectRoot, {
      EASELECT_KEY_ROOT: 'relative/keys',
    })).toThrow(/EASELECT_KEY_ROOT/);
    expect(() => resolveEaselectPrivatePaths(projectRoot, {
      EASELECT_KEY_ROOT: path.join(projectRoot, 'private'),
    })).toThrow(/EASELECT_KEY_ROOT/);
  });
});
