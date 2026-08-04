// @vitest-environment jsdom
// admin_version_info_indicator.test.js
// Verifies route-gated rendering and localized version labels in the filterbar footer.
// Bridges mocked admin permissions and the protected version endpoint with the DOM indicator.
// Exists to prevent version details from leaking into non-admin browser shells.

import { beforeEach, describe, expect, test, vi } from "vitest";

const hasRoutePermissionMock = vi.fn();
const fetchAdminVersionInfoMock = vi.fn();

vi.mock("../route_permission_checker.js", () => ({
    hasRoutePermission: hasRoutePermissionMock,
}));

vi.mock("../endpoints/stable_endpoint_router.js", () => ({
    fetchAdminVersionInfo: fetchAdminVersionInfoMock,
}));

vi.mock("../state_stores/lang_preference_reader.js", () => ({
    getLanguageWithBrowserFallback: vi.fn(() => "fi"),
}));

describe("admin version info indicator", () => {
    beforeEach(() => {
        hasRoutePermissionMock.mockReset();
        fetchAdminVersionInfoMock.mockReset();
        document.body.innerHTML = "";
        document.head.innerHTML = '<meta property="og:site_name" content="Filt">';
    });

    test("does not render without the protected route permission", async () => {
        hasRoutePermissionMock.mockReturnValue(false);
        const { buildAdminVersionInfoIndicator } = await import("./admin_version_info_indicator.js");

        expect(buildAdminVersionInfoIndicator()).toBeNull();
        expect(fetchAdminVersionInfoMock).not.toHaveBeenCalled();
    });

    test("hydrates a shared info icon and toggles the version panel by click", async () => {
        hasRoutePermissionMock.mockReturnValue(true);
        fetchAdminVersionInfoMock.mockResolvedValue({
            product_name: "Filterest",
            app_version: "8.27.99",
            db_version: "8.0.55",
            required_db_version: "8.0.55",
            db_compatible: true,
            runtime_mode: "docker",
        });
        const { buildAdminVersionInfoIndicator } = await import("./admin_version_info_indicator.js");

        const shell = buildAdminVersionInfoIndicator();
        document.body.appendChild(shell);

        await vi.waitFor(() => expect(shell.hidden).toBe(false));
        const indicator = shell.querySelector('[data-testid="filterbar-admin-version-info"]');
        const panel = shell.querySelector('[data-testid="filterbar-admin-version-info-panel"]');

        expect(fetchAdminVersionInfoMock).toHaveBeenCalledWith({ suppressAuthRedirect: true });
        expect(indicator.tagName).toBe("BUTTON");
        expect(indicator.querySelector("svg")).toBeTruthy();
        expect(indicator.title).toContain("Filterest 8.27.99");
        expect(indicator.title).toContain("Tietokanta 8.0.55 (yhteensopiva)");
        expect(indicator.title).toContain("Ajotapa Docker");
        expect(indicator.title).not.toContain(":");
        expect(indicator.getAttribute("aria-expanded")).toBe("false");
        expect(indicator.getAttribute("aria-controls")).toBe(panel.id);
        expect(panel.tagName).toBe("TABLE");
        expect(panel.getAttribute("aria-label")).toBe("Versioinfo");
        expect(panel.querySelector("caption")?.textContent).toBe("Versioinfo");
        expect(panel.querySelectorAll("tbody > tr")).toHaveLength(5);
        expect(panel.querySelector('[data-version-info-key="site"]')?.textContent)
            .toBe("Sivusto");
        expect(panel.querySelector('[data-version-info-value="site"]')?.textContent)
            .toBe("Filt");
        expect(panel.querySelector('[data-version-info-key="application"]')?.tagName)
            .toBe("TH");
        expect(panel.querySelector('[data-version-info-value="application"]')?.tagName)
            .toBe("TD");
        expect(panel.querySelector('[data-version-info-key="application"]')?.textContent)
            .toBe("Filterest");
        expect(panel.querySelector('[data-version-info-value="application"]')?.textContent)
            .toBe("8.27.99");
        expect(panel.querySelector('[data-version-info-key="runtime"]')?.textContent)
            .toBe("Ajotapa");
        expect(panel.querySelector('[data-version-info-value="runtime"]')?.textContent)
            .toBe("Docker");
        expect(panel.hidden).toBe(true);

        indicator.click();
        expect(indicator.getAttribute("aria-expanded")).toBe("true");
        expect(panel.hidden).toBe(false);
        panel.click();
        expect(panel.hidden).toBe(false);

        indicator.click();
        expect(indicator.getAttribute("aria-expanded")).toBe("false");
        expect(panel.hidden).toBe(true);

        const outsideButton = document.createElement("button");
        outsideButton.addEventListener("click", (event) => event.stopPropagation());
        document.body.appendChild(outsideButton);
        indicator.click();
        outsideButton.click();
        expect(indicator.getAttribute("aria-expanded")).toBe("false");
        expect(panel.hidden).toBe(true);

        shell.destroy();
    });

    test.each([
        ["fi", "Ajotapa Tavallinen"],
        ["en", "Runtime Native"],
        ["ch", "运行方式 本机"],
        ["yue", "執行方式 原生"],
    ])("localizes the native runtime label for %s", async (language, expected) => {
        const { formatAdminVersionInfoLabel } = await import("./admin_version_info_indicator.js");

        const label = formatAdminVersionInfoLabel({ runtime_mode: "native" }, language);

        expect(label).toContain(expected);
        expect(label).not.toContain(":");
    });
});
