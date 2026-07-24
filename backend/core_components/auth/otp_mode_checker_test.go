// otp_mode_checker_test.go
// Covers environment gating for the static OTP development fallback.
// Bridges auth env configuration and the login/password-reset OTP entry points.
// Exists to stop production-like configs from silently re-enabling static OTP.

package auth

import "testing"

func TestIsStaticOTPDevMode_TrueOnlyInExplicitDevMode(t *testing.T) {
	t.Setenv("ENVIRONMENT_TYPE", "dev")
	t.Setenv("LOGIN_OTP_CODE", "334726")
	t.Setenv("POSTMARK_API_KEY", "")

	if !isStaticOTPDevMode() {
		t.Fatal("expected static OTP dev mode to be enabled in explicit dev configuration")
	}
}

func TestIsStaticOTPDevMode_FalseOutsideDevMode(t *testing.T) {
	t.Setenv("ENVIRONMENT_TYPE", "production")
	t.Setenv("LOGIN_OTP_CODE", "334726")
	t.Setenv("POSTMARK_API_KEY", "")

	if isStaticOTPDevMode() {
		t.Fatal("expected static OTP dev mode to stay disabled outside explicit dev mode")
	}
}

func TestIsStaticOTPDevMode_TrueWhenPostmarkConfiguredInDev(t *testing.T) {
	t.Setenv("ENVIRONMENT_TYPE", "dev")
	t.Setenv("LOGIN_OTP_CODE", "334726")
	t.Setenv("POSTMARK_API_KEY", "postmark-live-key")

	if !isStaticOTPDevMode() {
		t.Fatal("expected static OTP dev mode to stay enabled in explicit dev mode even when Postmark is configured")
	}
}

func TestIsStaticOTPDevMode_TrueWhenLegacyPostmarkConfiguredInDev(t *testing.T) {
	t.Setenv("ENVIRONMENT_TYPE", "dev")
	t.Setenv("LOGIN_OTP_CODE", "334726")
	t.Setenv("POSTMARK_API_KEY", "")
	t.Setenv("POSTMARK_SERVER_TOKEN", "legacy-live-key")

	if !isStaticOTPDevMode() {
		t.Fatal("expected static OTP dev mode to stay enabled in explicit dev mode even when legacy Postmark config is present")
	}
}

func TestIsStaticOTPDevMode_FalseWithoutStaticCode(t *testing.T) {
	t.Setenv("ENVIRONMENT_TYPE", "dev")
	t.Setenv("LOGIN_OTP_CODE", "")
	t.Setenv("POSTMARK_API_KEY", "postmark-live-key")

	if isStaticOTPDevMode() {
		t.Fatal("expected static OTP dev mode to stay disabled when LOGIN_OTP_CODE is empty")
	}
}
