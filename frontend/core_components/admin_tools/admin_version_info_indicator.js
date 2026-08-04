// admin_version_info_indicator.js
// Builds the administrator-only product/database version control for the filterbar footer.
// Bridges route rights, the protected endpoint, the shared Material icon, and a click disclosure.
// Exists so admins can inspect versions by hover or click without exposing them to other users.

import { hasRoutePermission } from "../route_permission_checker.js";
import { fetchAdminVersionInfo } from "../endpoints/stable_endpoint_router.js";
import { getLanguageWithBrowserFallback } from "../state_stores/lang_preference_reader.js";
import { getCurrentSiteName } from "../state_stores/site_identity_reader.js";
import { getCardDetailIconSvgMarkup } from "../table_views/card_view/card_detail_icon_builder.js";

export const ADMIN_VERSION_INFO_ROUTE = "/api/admin/version-info";

let versionInfoPanelSequence = 0;

const VERSION_LABELS = Object.freeze({
    fi: {
        title: "Versioinfo",
        site: "Sivusto",
        app: "Sovellus",
        database: "Tietokanta",
        requiredDatabase: "Vaadittu tietokanta",
        runtime: "Ajotapa",
        runtimeDocker: "Docker",
        runtimeNative: "Tavallinen",
        compatible: "yhteensopiva",
        incompatible: "ei yhteensopiva",
    },
    en: {
        title: "Version information",
        site: "Site",
        app: "Application",
        database: "Database",
        requiredDatabase: "Required database",
        runtime: "Runtime",
        runtimeDocker: "Docker",
        runtimeNative: "Native",
        compatible: "compatible",
        incompatible: "incompatible",
    },
    ch: {
        title: "版本信息",
        site: "网站",
        app: "应用程序",
        database: "数据库",
        requiredDatabase: "所需数据库",
        runtime: "运行方式",
        runtimeDocker: "Docker",
        runtimeNative: "本机",
        compatible: "兼容",
        incompatible: "不兼容",
    },
    yue: {
        title: "版本資訊",
        site: "網站",
        app: "應用程式",
        database: "資料庫",
        requiredDatabase: "所需資料庫",
        runtime: "執行方式",
        runtimeDocker: "Docker",
        runtimeNative: "原生",
        compatible: "相容",
        incompatible: "不相容",
    },
});

export function buildAdminVersionInfoRows(versionInfo, language = "en", siteName = "") {
    const labels = VERSION_LABELS[language] || VERSION_LABELS.en;
    const productName = String(versionInfo?.product_name || labels.app).trim();
    const appVersion = String(versionInfo?.app_version || "unknown").trim();
    const databaseVersion = String(versionInfo?.db_version || "unknown").trim();
    const requiredDatabaseVersion = String(versionInfo?.required_db_version || "unknown").trim();
    const runtimeMode = String(versionInfo?.runtime_mode || "native").trim().toLowerCase();
    const runtimeLabel = runtimeMode === "docker"
        ? labels.runtimeDocker
        : labels.runtimeNative;
    const compatibilityLabel = versionInfo?.db_compatible
        ? labels.compatible
        : labels.incompatible;

    const rows = [
        { id: "application", label: productName, value: appVersion },
        {
            id: "database",
            label: labels.database,
            value: `${databaseVersion} (${compatibilityLabel})`,
        },
        {
            id: "required-database",
            label: labels.requiredDatabase,
            value: requiredDatabaseVersion,
        },
        { id: "runtime", label: labels.runtime, value: runtimeLabel },
    ];
    const normalizedSiteName = String(siteName || "").trim();
    if (normalizedSiteName) {
        rows.unshift({ id: "site", label: labels.site, value: normalizedSiteName });
    }
    return Object.freeze(rows);
}

export function formatAdminVersionInfoLabel(versionInfo, language = "en") {
    return buildAdminVersionInfoRows(versionInfo, language)
        .map(({ label, value }) => `${label} ${value}`)
        .join("\n");
}

function renderAdminVersionInfoRows(panel, rows, title) {
    const caption = document.createElement("caption");
    caption.classList.add("filterbar-clock-bar__version-info-title");
    caption.textContent = title;

    const body = document.createElement("tbody");
    const rowElements = rows.map(({ id, label, value }) => {
        const row = document.createElement("tr");

        const keyCell = document.createElement("th");
        keyCell.scope = "row";
        keyCell.classList.add("filterbar-clock-bar__version-info-key");
        keyCell.dataset.versionInfoKey = id;
        keyCell.textContent = label;

        const valueCell = document.createElement("td");
        valueCell.classList.add("filterbar-clock-bar__version-info-value");
        valueCell.dataset.versionInfoValue = id;
        valueCell.textContent = value;

        row.append(keyCell, valueCell);
        return row;
    });
    body.append(...rowElements);
    panel.replaceChildren(caption, body);
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
    const panel = document.createElement("table");
    panel.id = panelId;
    panel.classList.add("filterbar-clock-bar__version-info-panel");
    panel.dataset.testid = "filterbar-admin-version-info-panel";
    panel.setAttribute("aria-live", "polite");
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
        const language = getLanguageWithBrowserFallback();
        const labels = VERSION_LABELS[language] || VERSION_LABELS.en;
        const siteName = getCurrentSiteName() || String(versionInfo?.product_name || "").trim();
        const rows = buildAdminVersionInfoRows(versionInfo, language, siteName);
        const label = formatAdminVersionInfoLabel(
            versionInfo,
            language
        );
        indicator.title = label;
        indicator.setAttribute("aria-label", label.replaceAll("\n", ". "));
        panel.setAttribute("aria-label", labels.title);
        renderAdminVersionInfoRows(panel, rows, labels.title);
        shell.hidden = false;
    } catch {
        shell.destroy();
        shell.remove();
    }
}
