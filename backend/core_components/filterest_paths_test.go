package backend

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestResolveFilterestHomesAcceptsDynamicRelativeAndAbsolutePaths(t *testing.T) {
	projectRoot := t.TempDir()
	absoluteKeys := filepath.Join(t.TempDir(), "operator keys")
	config := strings.Join([]string{
		"schema_version=1",
		"projects_home=../customer projects",
		"keys_home=" + absoluteKeys,
		"",
	}, "\n")
	if err := os.WriteFile(
		filepath.Join(projectRoot, filterestLocalPathsFile),
		[]byte(config),
		0o600,
	); err != nil {
		t.Fatalf("write locator: %v", err)
	}

	homes, err := resolveFilterestHomes(projectRoot, false)
	if err != nil {
		t.Fatalf("resolveFilterestHomes() error = %v", err)
	}
	wantProjects := filepath.Clean(filepath.Join(projectRoot, "..", "customer projects"))
	if homes.ProjectsHome != wantProjects {
		t.Fatalf("ProjectsHome = %q, want %q", homes.ProjectsHome, wantProjects)
	}
	if homes.KeysHome != absoluteKeys {
		t.Fatalf("KeysHome = %q, want %q", homes.KeysHome, absoluteKeys)
	}
	if !homes.ProjectsHomeConfigured || !homes.KeysHomeConfigured {
		t.Fatalf("configured flags = %#v, want both true", homes)
	}
}

func TestResolveFilterestHomesRejectsDangerousAndNestedPaths(t *testing.T) {
	projectRoot := t.TempDir()
	tests := []struct {
		name     string
		projects string
		keys     string
	}{
		{name: "checkout root", projects: ".", keys: "../keys"},
		{name: "git", projects: ".git/projects", keys: "../keys"},
		{name: "same", projects: "../shared", keys: "../shared"},
		{name: "nested", projects: "../shared/projects", keys: "../shared"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Setenv("FILTEREST_PROJECTS_HOME", test.projects)
			t.Setenv("FILTEREST_KEYS_HOME", test.keys)
			if _, err := resolveFilterestHomes(projectRoot, false); err == nil {
				t.Fatal("resolveFilterestHomes() error = nil, want rejection")
			}
		})
	}
}

func TestResolveFilterestHomesFollowsExistingSymlinkBoundary(t *testing.T) {
	projectRoot := t.TempDir()
	externalRoot := t.TempDir()
	link := filepath.Join(projectRoot, "operator-home")
	if err := os.Symlink(externalRoot, link); err != nil {
		t.Fatalf("symlink: %v", err)
	}
	t.Setenv("FILTEREST_PROJECTS_HOME", "projects")
	t.Setenv("FILTEREST_KEYS_HOME", "operator-home/keys")

	homes, err := resolveFilterestHomes(projectRoot, false)
	if err != nil {
		t.Fatalf("resolveFilterestHomes() error = %v", err)
	}
	want := filepath.Join(externalRoot, "keys")
	if homes.KeysHome != want {
		t.Fatalf("KeysHome = %q, want symlink-resolved %q", homes.KeysHome, want)
	}
}
