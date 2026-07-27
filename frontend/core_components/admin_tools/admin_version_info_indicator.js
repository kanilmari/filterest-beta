// admin_version_info_indicator.js
// Builds the administrator-only product/database version indicator for the filterbar footer.
// Bridges cached route rights, the protected version endpoint, and an accessible hover label.
// Exists to keep version details convenient for admins without rendering the control to other users.

import { hasRoutePermission } from "../route_permission_checker.js";
import { fetchAdminVersionInfo } from "../endpoints/stable_endpoint_router.js";
import { getLanguageWithBrowserFallback } from "../state_stores/lang_preference_reader.js";

export const ADMIN_VERSION_INFO_ROUTE = "/api/admin/version-info";

const VERSION_LABELS = Object.freeze({
    fi: {
        app: "Sovellus",
        database: "Tietokanta",
        requiredDatabase: "Vaadittu tietokanta",
        compatible: "yhteensopiva",
        incompatible: "ei yhteensopiva",
    },
    en: {
        app: "Application",
        database: "Database",
        requiredDatabase: "Required database",
        compatible: "compatible",
        incompatible: "incompatible",
    },
    ch: {
        app: "应用程序",
        database: "数据库",
        requiredDatabase: "所需数据库",
        compatible: "兼容",
        incompatible: "不兼容",
    },
    yue: {
        app: "應用程式",
        database: "資料庫",
        requiredDatabase: "所需資料庫",
        compatible: "相容",
        incompatible: "不相容",
    },
});

export function formatAdminVersionInfoLabel(versionInfo, language = "en") {
    const labels = VERSION_LABELS[language] || VERSION_LABELS.en;
    const productName = String(versionInfo?.product_name || labels.app).trim();
    const appVersion = String(versionInfo?.app_version || "unknown").trim();
    const databaseVersion = String(versionInfo?.db_version || "unknown").trim();
    const requiredDatabaseVersion = String(versionInfo?.required_db_version || "unknown").trim();
    const compatibilityLabel = versionInfo?.db_compatible
        ? labels.compatible
        : labels.incompatible;

    return [
        `${productName}: ${appVersion}`,
        `${labels.database}: ${databaseVersion} (${compatibilityLabel})`,
        `${labels.requiredDatabase}: ${requiredDatabaseVersion}`,
    ].join("\n");
}

export function buildAdminVersionInfoIndicator() {
    if (!hasRoutePermission(ADMIN_VERSION_INFO_ROUTE)) {
        return null;
    }

    const indicator = document.createElement("span");
    indicator.classList.add("filterbar-clock-bar__version-info");
    indicator.dataset.testid = "filterbar-admin-version-info";
    indicator.setAttribute("role", "img");
    indicator.setAttribute("aria-hidden", "true");
    indicator.tabIndex = -1;
    indicator.hidden = true;
    indicator.textContent = "i";

    void hydrateAdminVersionInfoIndicator(indicator);
    return indicator;
}

async function hydrateAdminVersionInfoIndicator(indicator) {
    try {
        const versionInfo = await fetchAdminVersionInfo({ suppressAuthRedirect: true });
        const label = formatAdminVersionInfoLabel(
            versionInfo,
            getLanguageWithBrowserFallback()
        );
        indicator.title = label;
        indicator.setAttribute("aria-label", label.replaceAll("\n", ". "));
        indicator.setAttribute("aria-hidden", "false");
        indicator.tabIndex = 0;
        indicator.hidden = false;
    } catch {
        indicator.remove();
    }
}
