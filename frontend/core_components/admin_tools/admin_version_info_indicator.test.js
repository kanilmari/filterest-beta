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
    });

    test("does not render without the protected route permission", async () => {
        hasRoutePermissionMock.mockReturnValue(false);
        const { buildAdminVersionInfoIndicator } = await import("./admin_version_info_indicator.js");

        expect(buildAdminVersionInfoIndicator()).toBeNull();
        expect(fetchAdminVersionInfoMock).not.toHaveBeenCalled();
    });

    test("hydrates an accessible admin label from the protected endpoint", async () => {
        hasRoutePermissionMock.mockReturnValue(true);
        fetchAdminVersionInfoMock.mockResolvedValue({
            product_name: "Filterest",
            app_version: "8.27.99",
            db_version: "8.0.55",
            required_db_version: "8.0.55",
            db_compatible: true,
        });
        const { buildAdminVersionInfoIndicator } = await import("./admin_version_info_indicator.js");

        const indicator = buildAdminVersionInfoIndicator();
        document.body.appendChild(indicator);

        await vi.waitFor(() => expect(indicator.hidden).toBe(false));
        expect(fetchAdminVersionInfoMock).toHaveBeenCalledWith({ suppressAuthRedirect: true });
        expect(indicator.title).toContain("Filterest: 8.27.99");
        expect(indicator.title).toContain("Tietokanta: 8.0.55 (yhteensopiva)");
        expect(indicator.getAttribute("aria-hidden")).toBe("false");
        expect(indicator.tabIndex).toBe(0);
    });
});
