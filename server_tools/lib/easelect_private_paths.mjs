// easelect_private_paths.mjs
// Resolves native Easelect env and TLS files from one protected external key root.
// Bridges Node/Playwright tooling with the same contract used by shell and Go startup.
// Exists so source tooling works without secret-bearing files or symlinks in repo root.

import fs from 'fs';
import path from 'path';

export function isPrivateEaselectSourceCheckout(projectRoot) {
  return (
    fs.existsSync(path.join(projectRoot, '.git'))
    && fs.existsSync(path.join(projectRoot, 'VERSION_EASELECT'))
  );
}

function validateExternalKeyRoot(projectRoot, keyRoot) {
  if (!path.isAbsolute(keyRoot)) {
    throw new Error('invalid EASELECT_KEY_ROOT: path must be absolute');
  }

  const normalizedProjectRoot = path.resolve(projectRoot);
  const normalizedKeyRoot = path.resolve(keyRoot);
  const relativePath = path.relative(normalizedProjectRoot, normalizedKeyRoot);
  if (
    relativePath === ''
    || (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`))
  ) {
    throw new Error('invalid EASELECT_KEY_ROOT: path must stay outside the Easelect repository');
  }
  return normalizedKeyRoot;
}

// Returns derived internal paths; EASELECT_KEY_ROOT is the only supported override.
// Generated Filterest and deployed runtimes deliberately keep root-local files.
export function resolveEaselectPrivatePaths(
  projectRoot,
  environment = process.env,
) {
  const normalizedProjectRoot = path.resolve(projectRoot);
  if (!isPrivateEaselectSourceCheckout(normalizedProjectRoot)) {
    return {
      runtimeEnvFile: path.join(normalizedProjectRoot, '.env'),
      developmentEnvFile: path.join(normalizedProjectRoot, 'dev_env.txt'),
      tlsCertificateFile: path.join(normalizedProjectRoot, 'dev-cert.crt'),
      tlsPrivateKeyFile: path.join(normalizedProjectRoot, 'dev-cert.key'),
    };
  }

  const configuredKeyRoot = String(environment.EASELECT_KEY_ROOT || '').trim();
  const keyRoot = validateExternalKeyRoot(
    normalizedProjectRoot,
    configuredKeyRoot || path.resolve(normalizedProjectRoot, '..', 'filterest_keys'),
  );
  const developmentRoot = path.join(keyRoot, 'easelect_development');

  return {
    runtimeEnvFile: path.join(developmentRoot, 'runtime_environment.env'),
    developmentEnvFile: path.join(developmentRoot, 'development_environment.env'),
    tlsCertificateFile: path.join(
      developmentRoot,
      'local_tls_certificate',
      'localhost_certificate.crt',
    ),
    tlsPrivateKeyFile: path.join(
      developmentRoot,
      'local_tls_certificate',
      'localhost_private_key.key',
    ),
  };
}
