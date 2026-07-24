// seo_meta_builder_test.go
// Regression tests for browser-facing SEO metadata values.
// Bridges request host headers, SITE_NAME fallback config, and index template metadata.
// Exists to keep domain deployments from leaking stale branding into page titles.
package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestResolvePageMetaUsesRequestHostForTitleSiteName(t *testing.T) {
	t.Setenv("SITE_NAME", "Serlog.com")

	req := httptest.NewRequest(http.MethodGet, "https://filterest.com/", nil)
	meta := resolvePageMeta(req)

	if meta.PageTitle != "filterest.com" {
		t.Fatalf("PageTitle = %q, want %q", meta.PageTitle, "filterest.com")
	}
	if meta.SiteName != "filterest.com" {
		t.Fatalf("SiteName = %q, want %q", meta.SiteName, "filterest.com")
	}
	if strings.Contains(strings.ToLower(meta.OGDescription), "serlog") {
		t.Fatalf("OGDescription leaked stale site name: %q", meta.OGDescription)
	}
}

func TestResolvePageSiteNameUsesForwardedHostAndStripsPort(t *testing.T) {
	t.Setenv("SITE_NAME", "Serlog.com")

	req := httptest.NewRequest(http.MethodGet, "http://127.0.0.1/", nil)
	req.Host = "127.0.0.1:8082"
	req.Header.Set("X-Forwarded-Host", "Filterest.com:443")

	if got := resolvePageSiteName(req); got != "filterest.com" {
		t.Fatalf("resolvePageSiteName() = %q, want %q", got, "filterest.com")
	}
}

func TestResolvePageSiteNameFallsBackToEnvWithoutRequestHost(t *testing.T) {
	t.Setenv("SITE_NAME", "Serlog.com")

	if got := resolvePageSiteName(nil); got != "Serlog.com" {
		t.Fatalf("resolvePageSiteName(nil) = %q, want %q", got, "Serlog.com")
	}
}

func TestResolveBaseURLStripsDefaultForwardedPort(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://127.0.0.1/", nil)
	req.Header.Set("X-Forwarded-Proto", "https")
	req.Header.Set("X-Forwarded-Host", "filterest.com:443")

	if got := resolveBaseURL(req); got != "https://filterest.com" {
		t.Fatalf("resolveBaseURL() = %q, want %q", got, "https://filterest.com")
	}
}

func TestResolveBaseURLPreservesNonDefaultLocalPort(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://localhost:8082/", nil)
	req.Host = "localhost:8082"

	if got := resolveBaseURL(req); got != "https://localhost:8082" {
		t.Fatalf("resolveBaseURL() = %q, want %q", got, "https://localhost:8082")
	}
}
