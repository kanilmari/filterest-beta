// env_loader.go
// Loads environment variables from the native-local dev files and .env fallbacks.
// In Docker deployments environment variables are injected via docker-compose files.
// ENVIRONMENT_TYPE now fails closed to "prod" unless development is set explicitly.
package backend

import (
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

var (
	envLoaded     bool
	envLoadedType string
	envLoadMu     sync.Mutex
)

// LoadEnvironmentVariables loads .env file (if present) and returns the
// environment type. Docker environment variables take precedence.
// Returns "prod" by default unless development is requested explicitly.
func LoadEnvironmentVariables() (string, error) {
	envLoadMu.Lock()
	defer envLoadMu.Unlock()

	envType, err := loadAndSetEnvironmentVariables()
	envLoaded = true
	envLoadedType = envType

	return envType, err
}

func ensureEnvironmentVariablesLoaded() (string, error) {
	envLoadMu.Lock()
	loaded := envLoaded
	envType := envLoadedType
	envLoadMu.Unlock()

	if loaded {
		return envType, nil
	}

	return LoadEnvironmentVariables()
}

func loadAndSetEnvironmentVariables() (string, error) {
	// Native local development is defined by dev_env.txt. Load it first so its
	// explicit development settings win over .env defaults, while still keeping
	// already-exported environment variables (for Docker/runtime) authoritative.
	for _, envFile := range []string{"dev_env.txt", ".env"} {
		if err := loadEnvironmentFileIfPresent(envFile); err != nil {
			return "", err
		}
	}

	// Get environment type: fail closed to production unless development is explicit.
	envType := strings.TrimSpace(os.Getenv("ENVIRONMENT_TYPE"))
	if envType == "" {
		envType = "prod"
	}

	// Ensure ENVIRONMENT_TYPE is set for other packages
	_ = os.Setenv("ENVIRONMENT_TYPE", envType)

	return envType, nil
}

func loadEnvironmentFileIfPresent(envFile string) error {
	if err := godotenv.Load(envFile); err != nil {
		if !os.IsNotExist(err) {
			return fmt.Errorf("%s: %w", envFile, err)
		}
	}

	return nil
}
