// site_identity_reader.js
// Reads the administrator-owned site name from the server-rendered application shell.
// Bridges SEO metadata and browser UI components that need one stable site identity.
// Exists so dynamic site names remain untranslated and are not duplicated in language data.

export function getCurrentSiteName(root = document) {
    const metadataName = root
        .querySelector?.('meta[property="og:site_name"]')
        ?.getAttribute("content")
        ?.trim();
    if (metadataName) {
        return metadataName;
    }

    return root
        .querySelector?.(".navbar-site-identity")
        ?.textContent
        ?.trim() || "";
}
