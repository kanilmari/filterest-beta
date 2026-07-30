"""test_docker_storage_deleted_mounts.py
Verifies Docker runtimes persist both active and recoverable media roots.
Bridges Compose bind mounts and instance-directory scaffolding.
Exists so container rebuilds cannot discard media archived after a database deletion.
"""

from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class DockerStorageDeletedMountTests(unittest.TestCase):
    def test_every_app_compose_mounts_recoverable_media(self) -> None:
        expected_mounts = {
            "docker/docker-compose.yml": "../storage_deleted:/app/storage_deleted",
            "docker/docker-compose.dev.yml": "../storage_deleted:/app/storage_deleted",
            "docker/docker-compose.mcp.yml": "../storage_deleted:/app/storage_deleted",
            "docker/docker-compose.instance.yml": (
                "../instances/${INSTANCE:-default}/storage_deleted:/app/storage_deleted"
            ),
        }

        for relative_path, expected_mount in expected_mounts.items():
            with self.subTest(compose=relative_path):
                compose_text = (PROJECT_ROOT / relative_path).read_text(encoding="utf-8")
                self.assertIn(expected_mount, compose_text)

    def test_instance_scaffolding_creates_recoverable_media_root(self) -> None:
        create_source = (
            PROJECT_ROOT / "server_tools/ctl/lib/instance_crud.sh"
        ).read_text(encoding="utf-8")
        helper_source = (
            PROJECT_ROOT / "server_tools/ctl/lib/instance_helpers.sh"
        ).read_text(encoding="utf-8")

        self.assertIn("{storage,storage_deleted,backups}", create_source)
        self.assertIn("for storage_name in storage storage_deleted", helper_source)

    def test_vps_deploy_preserves_and_backs_up_recoverable_media(self) -> None:
        deploy_source = (
            PROJECT_ROOT / "server_tools/deploy_docker_vps.sh"
        ).read_text(encoding="utf-8")

        self.assertIn('"--filter=P instances/*/storage_deleted/"', deploy_source)
        self.assertIn('"--filter=- instances/*/storage_deleted/"', deploy_source)
        self.assertIn(
            'storage_deleted_dir="instances/\\${instance}/storage_deleted"',
            deploy_source,
        )
        self.assertIn(
            "storage_deleted_pre_upgrade_\\${backup_ts}.tar.gz",
            deploy_source,
        )
        self.assertIn(
            'mkdir -p "\\${backup_dir}" "\\${storage_dir}" "\\${storage_deleted_dir}"',
            deploy_source,
        )
        self.assertIn(".easelect-host-write-probe", deploy_source)
        self.assertIn(".easelect-container-write-probe", deploy_source)
        self.assertIn("Docker storage ownership does not match runtime", deploy_source)

    def test_container_runtime_identity_matches_host_storage_owner(self) -> None:
        for dockerfile_name in (
            "docker/Dockerfile",
            "docker/Dockerfile.dev",
            "docker/Dockerfile.mcp",
        ):
            with self.subTest(dockerfile=dockerfile_name):
                dockerfile = (PROJECT_ROOT / dockerfile_name).read_text(encoding="utf-8")
                self.assertIn("ARG EASELECT_RUNTIME_UID=1000", dockerfile)
                self.assertIn("ARG EASELECT_RUNTIME_GID=1000", dockerfile)
                self.assertIn('adduser -u "${EASELECT_RUNTIME_UID}"', dockerfile)
                self.assertNotIn("adduser -u 1001", dockerfile)

        for compose_name in (
            "docker/docker-compose.yml",
            "docker/docker-compose.mcp.yml",
            "docker/docker-compose.instance.yml",
        ):
            with self.subTest(compose=compose_name):
                compose = (PROJECT_ROOT / compose_name).read_text(encoding="utf-8")
                self.assertIn(
                    "EASELECT_RUNTIME_UID: ${EASELECT_RUNTIME_UID:-1000}",
                    compose,
                )
                self.assertIn(
                    "EASELECT_RUNTIME_GID: ${EASELECT_RUNTIME_GID:-1000}",
                    compose,
                )

        helper_source = (
            PROJECT_ROOT / "server_tools/ctl/lib/instance_helpers.sh"
        ).read_text(encoding="utf-8")
        self.assertIn('${configured_runtime_uid:-$(id -u)}', helper_source)
        self.assertIn('${configured_runtime_gid:-$(id -g)}', helper_source)
        self.assertIn("chmod -R u+rwX,g+rwX,o-rwx", helper_source)
        self.assertIn("validate_docker_runtime_identity", helper_source)
        self.assertIn(".easelect-write-probe.XXXXXX", helper_source)
        self.assertNotIn("chmod -R u+rwX,g+rwX,o-rwx \"$instance_storage\" 2>/dev/null || true", helper_source)

    def test_local_docker_uses_compose_v2_and_protected_host_mounts(self) -> None:
        docker_source = (
            PROJECT_ROOT / "server_tools/ctl/lib/docker.sh"
        ).read_text(encoding="utf-8")
        compose_source = (
            PROJECT_ROOT / "docker/docker-compose.dev.yml"
        ).read_text(encoding="utf-8")

        self.assertIn("docker compose --env-file", docker_source)
        self.assertNotIn("docker-compose --env-file", docker_source)
        self.assertIn("prepare_local_docker_storage", docker_source)
        self.assertIn(
            'for storage_name in storage storage_deleted db_backups',
            docker_source,
        )
        self.assertIn("Docker bind-mount ownership does not match runtime", docker_source)
        self.assertIn(
            "${APP_BIND_HOST:-127.0.0.1}:${APP_PORT:-8082}:8082",
            compose_source,
        )
        self.assertIn(
            "${DB_BIND_HOST:-127.0.0.1}:${DB_PORT:-5433}:5432",
            compose_source,
        )

    def test_healthcheck_and_default_database_binding_are_safe(self) -> None:
        for dockerfile_name in ("docker/Dockerfile", "docker/Dockerfile.mcp"):
            with self.subTest(dockerfile=dockerfile_name):
                dockerfile = (PROJECT_ROOT / dockerfile_name).read_text(encoding="utf-8")
                self.assertIn("http://localhost:8082/health", dockerfile)
                self.assertNotIn("http://localhost:8082/api/health", dockerfile)

        compose = (PROJECT_ROOT / "docker/docker-compose.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "${DB_BIND_HOST:-127.0.0.1}:${DB_PORT:-5432}:5432",
            compose,
        )
        self.assertNotIn('"5432:5432"', compose)


if __name__ == "__main__":
    unittest.main()
