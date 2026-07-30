// admin_version_info_indicator.js
// Builds the administrator-only product/database version control for the filterbar footer.
// Bridges route rights, the protected endpoint, the shared Material icon, and a click disclosure.
// Exists so admins can inspect versions by hover or click without exposing them to other users.

import { hasRoutePermission } from "../route_permission_checker.js";
import { fetchAdminVersionInfo } from "../endpoints/stable_endpoint_router.js";
import { getLanguageWithBrowserFallback } from "../state_stores/lang_preference_reader.js";
import { getCardDetailIconSvgMarkup } from "../table_views/card_view/card_detail_icon_builder.js";

export const ADMIN_VERSION_INFO_ROUTE = "/api/admin/version-info";

let versionInfoPanelSequence = 0;

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

    const lifetimeController = new AbortController();
    const { signal } = lifetimeController;
    const shell = document.createElement("div");
    shell.classList.add("filterbar-clock-bar__version-info-shell");
    shell.hidden = true;

    const indicator = document.createElement("button");
    indicator.type = "button";
    indicator.classList.add("filterbar-clock-bar__version-info");
    indicator.dataset.testid = "filterbar-admin-version-info";
    indicator.setAttribute("aria-expanded", "false");

    const panelId = `filterbar-admin-version-info-panel-${++versionInfoPanelSequence}`;
    const panel = document.createElement("div");
    panel.id = panelId;
    panel.classList.add("filterbar-clock-bar__version-info-panel");
    panel.dataset.testid = "filterbar-admin-version-info-panel";
    panel.setAttribute("role", "status");
    panel.hidden = true;
    indicator.setAttribute("aria-controls", panelId);

    const icon = document.createElement("span");
    icon.classList.add("filterbar-clock-bar__version-info-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = getCardDetailIconSvgMarkup("info");
    indicator.appendChild(icon);
    shell.append(indicator, panel);

    const closePanel = () => {
        panel.hidden = true;
        indicator.setAttribute("aria-expanded", "false");
    };
    const togglePanel = () => {
        const shouldOpen = panel.hidden;
        panel.hidden = !shouldOpen;
        indicator.setAttribute("aria-expanded", String(shouldOpen));
    };

    indicator.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePanel();
    }, { signal });
    document.addEventListener("click", (event) => {
        if (!panel.hidden && !shell.contains(event.target)) {
            closePanel();
        }
    }, { signal, capture: true });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel();
            indicator.focus();
        }
    }, { signal });

    shell.destroy = () => {
        lifetimeController.abort();
        closePanel();
    };

    void hydrateAdminVersionInfoIndicator(shell, indicator, panel);
    return shell;
}

async function hydrateAdminVersionInfoIndicator(shell, indicator, panel) {
    try {
        const versionInfo = await fetchAdminVersionInfo({ suppressAuthRedirect: true });
        const label = formatAdminVersionInfoLabel(
            versionInfo,
            getLanguageWithBrowserFallback()
        );
        indicator.title = label;
        indicator.setAttribute("aria-label", label.replaceAll("\n", ". "));
        panel.textContent = label;
        shell.hidden = false;
    } catch {
        shell.destroy();
        shell.remove();
    }
}
