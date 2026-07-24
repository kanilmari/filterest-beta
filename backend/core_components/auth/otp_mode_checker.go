// otp_mode_checker.go
// Resolves which OTP fallback mode is allowed for auth flows.
// Bridges environment configuration and the login/password-reset handlers.
// Exists to keep static OTP dev fallback impossible outside explicit dev mode.

package auth

import (
	"os"
	"strings"
)

// isExplicitDevEnvironment keeps auth-only dev fallbacks gated behind the explicit dev env.
func isExplicitDevEnvironment() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv("ENVIRONMENT_TYPE")), "dev")
}

// firstConfiguredAuthEnv resolves the first non-empty auth-related env alias.
func firstConfiguredAuthEnv(keys ...string) string {
	for _, key := range keys {
		value := strings.TrimSpace(os.Getenv(key))
		if value != "" {
			return value
		}
	}
	return ""
}

// isPostmarkDeliveryConfiguredForAuth keeps auth OTP gating aligned with both canonical and legacy Postmark env names.
func isPostmarkDeliveryConfiguredForAuth() bool {
	return firstConfiguredAuthEnv("POSTMARK_API_KEY", "POSTMARK_SERVER_TOKEN") != ""
}

// isStaticOTPDevMode returns true only for explicit dev-mode static OTP fallback.
func isStaticOTPDevMode() bool {
	return strings.TrimSpace(os.Getenv("LOGIN_OTP_CODE")) != "" && isExplicitDevEnvironment()
}
