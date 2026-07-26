"""Resolve native Easelect private env and TLS paths from one external key root.

Bridges Python developer tools with the same source/runtime boundary used by
shell, Node, and Go startup. Generated Filterest and deployed runtimes remain
root-local; only a private Git checkout uses the sibling protected key store.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
from typing import Mapping


@dataclass(frozen=True)
class EaselectPrivatePaths:
    runtime_env_file: Path
    development_env_file: Path
    tls_certificate_file: Path
    tls_private_key_file: Path


def is_private_easelect_source_checkout(project_root: Path) -> bool:
    """Return true only for the private Git checkout, not copied deployments."""

    return (project_root / ".git").exists() and (project_root / "VERSION_EASELECT").is_file()


def _validated_external_key_root(project_root: Path, raw_key_root: str) -> Path:
    key_root = Path(raw_key_root)
    if not key_root.is_absolute():
        raise ValueError("invalid EASELECT_KEY_ROOT: path must be absolute")

    normalized_project_root = project_root.resolve()
    normalized_key_root = key_root.resolve()
    try:
        normalized_key_root.relative_to(normalized_project_root)
    except ValueError:
        return normalized_key_root
    raise ValueError(
        "invalid EASELECT_KEY_ROOT: path must stay outside the Easelect repository"
    )


def resolve_easelect_private_paths(
    project_root: Path | str,
    environment: Mapping[str, str] | None = None,
) -> EaselectPrivatePaths:
    """Derive all private file paths from the one EASELECT_KEY_ROOT override."""

    resolved_project_root = Path(project_root).resolve()
    if not is_private_easelect_source_checkout(resolved_project_root):
        return EaselectPrivatePaths(
            runtime_env_file=resolved_project_root / ".env",
            development_env_file=resolved_project_root / "dev_env.txt",
            tls_certificate_file=resolved_project_root / "dev-cert.crt",
            tls_private_key_file=resolved_project_root / "dev-cert.key",
        )

    resolved_environment = os.environ if environment is None else environment
    configured_key_root = resolved_environment.get("EASELECT_KEY_ROOT", "").strip()
    key_root = _validated_external_key_root(
        resolved_project_root,
        configured_key_root or str(resolved_project_root.parent / "filterest_keys"),
    )
    development_root = key_root / "easelect_development"
    tls_root = development_root / "local_tls_certificate"
    return EaselectPrivatePaths(
        runtime_env_file=development_root / "runtime_environment.env",
        development_env_file=development_root / "development_environment.env",
        tls_certificate_file=tls_root / "localhost_certificate.crt",
        tls_private_key_file=tls_root / "localhost_private_key.key",
    )
