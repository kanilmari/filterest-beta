// version_check_test.go
// Tests startup version marker selection for private and public checkouts.
// Bridges temporary project roots and version logging helpers.
// Exists so Filterest can use VERSION_APP without regressing private Easelect.
package startup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReadApplicationVersionFilePrefersEaselectMarker(t *testing.T) {
	root := t.TempDir()
	mustWriteVersionFile(t, root, "VERSION_EASELECT", "8.0.17\n")
	mustWriteVersionFile(t, root, "VERSION_APP", "8.0.16\n")

	version, fileName, err := readApplicationVersionFile(root)
	if err != nil {
		t.Fatal(err)
	}
	if version != "8.0.17" || fileName != "VERSION_EASELECT" {
		t.Fatalf("version/file = %q/%q, want 8.0.17/VERSION_EASELECT", version, fileName)
	}
}

func TestReadApplicationVersionFileFallsBackToPublicMarker(t *testing.T) {
	root := t.TempDir()
	mustWriteVersionFile(t, root, "VERSION_APP", "8.0.17\n")

	version, fileName, err := readApplicationVersionFile(root)
	if err != nil {
		t.Fatal(err)
	}
	if version != "8.0.17" || fileName != "VERSION_APP" {
		t.Fatalf("version/file = %q/%q, want 8.0.17/VERSION_APP", version, fileName)
	}
}

func mustWriteVersionFile(t *testing.T, root string, fileName string, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(root, fileName), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
