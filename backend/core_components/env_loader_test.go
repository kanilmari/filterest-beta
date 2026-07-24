// env_loader_test.go
// Verifies environment loading defaults and explicit overrides for runtime mode selection.
// Bridges env_loader.go with process environment state under test control.
// Exists to keep ENVIRONMENT_TYPE fail-closed when no explicit development mode is configured.
package backend

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadAndSetEnvironmentVariablesDefaultsToProdWhenUnset(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tempDir := t.TempDir()
	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("chdir temp dir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(originalWd)
	})

	t.Setenv("ENVIRONMENT_TYPE", "")

	envType, err := loadAndSetEnvironmentVariables()
	if err != nil {
		t.Fatalf("loadAndSetEnvironmentVariables() error = %v", err)
	}
	if envType != "prod" {
		t.Fatalf("envType = %q, want prod", envType)
	}
	if got := os.Getenv("ENVIRONMENT_TYPE"); got != "prod" {
		t.Fatalf("ENVIRONMENT_TYPE = %q, want prod", got)
	}
}

func TestLoadAndSetEnvironmentVariablesHonorsExplicitDev(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tempDir := t.TempDir()
	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("chdir temp dir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(originalWd)
	})

	t.Setenv("ENVIRONMENT_TYPE", "dev")

	envType, err := loadAndSetEnvironmentVariables()
	if err != nil {
		t.Fatalf("loadAndSetEnvironmentVariables() error = %v", err)
	}
	if envType != "dev" {
		t.Fatalf("envType = %q, want dev", envType)
	}
	if got := os.Getenv("ENVIRONMENT_TYPE"); got != "dev" {
		t.Fatalf("ENVIRONMENT_TYPE = %q, want dev", got)
	}
}

func TestLoadAndSetEnvironmentVariablesReadsExplicitEnvFileValue(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tempDir := t.TempDir()
	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("chdir temp dir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(originalWd)
	})

	t.Setenv("ENVIRONMENT_TYPE", "placeholder")
	if err := os.Unsetenv("ENVIRONMENT_TYPE"); err != nil {
		t.Fatalf("unset ENVIRONMENT_TYPE: %v", err)
	}
	envFilePath := filepath.Join(tempDir, ".env")
	if err := os.WriteFile(envFilePath, []byte("ENVIRONMENT_TYPE=dev\n"), 0o644); err != nil {
		t.Fatalf("write .env: %v", err)
	}

	envType, err := loadAndSetEnvironmentVariables()
	if err != nil {
		t.Fatalf("loadAndSetEnvironmentVariables() error = %v", err)
	}
	if envType != "dev" {
		t.Fatalf("envType = %q, want dev", envType)
	}
	if got := os.Getenv("ENVIRONMENT_TYPE"); got != "dev" {
		t.Fatalf("ENVIRONMENT_TYPE = %q, want dev", got)
	}
}

func TestLoadAndSetEnvironmentVariablesPrefersDevEnvOverDotEnvForNativeLocal(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tempDir := t.TempDir()
	if err := os.Chdir(tempDir); err != nil {
		t.Fatalf("chdir temp dir: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(originalWd)
	})

	if err := os.WriteFile(filepath.Join(tempDir, ".env"), []byte("ENVIRONMENT_TYPE=prod\n"), 0o644); err != nil {
		t.Fatalf("write .env: %v", err)
	}
	if err := os.WriteFile(filepath.Join(tempDir, "dev_env.txt"), []byte("ENVIRONMENT_TYPE=dev\n"), 0o644); err != nil {
		t.Fatalf("write dev_env.txt: %v", err)
	}

	envType, err := loadAndSetEnvironmentVariables()
	if err != nil {
		t.Fatalf("loadAndSetEnvironmentVariables() error = %v", err)
	}
	if envType != "dev" {
		t.Fatalf("envType = %q, want dev", envType)
	}
	if got := os.Getenv("ENVIRONMENT_TYPE"); got != "dev" {
		t.Fatalf("ENVIRONMENT_TYPE = %q, want dev", got)
	}
}
