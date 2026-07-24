// tree_view_printer.js
// Renders dataset rows into the tree-view presentation.
// Bridges fetched row data and column metadata into the reusable vanilla tree renderer.
// Exists to provide a dataset-aware tree view without embedding tree rules into generic components.

import { render_tree } from '../../../reusable_components/vanilla_tree/vanilla_tree_builder.js';
import { endpoint_router } from '../../endpoints/endpoint_router.js';

const DATABASE_CATALOG_TREE_DATASETS = new Set([
    'system_table_folders',
    'system_db_tables',
]);
const DATABASE_CATALOG_TREE_CACHE_KEY = 'full_tree_data';
const DATABASE_CATALOG_TREE_CACHE_TS_KEY = 'full_tree_data_cached_at';
const DATABASE_CATALOG_TREE_CACHE_TTL_MS = 5 * 60 * 1000;

function shouldRenderDatabaseCatalogTree(tableName) {
    return DATABASE_CATALOG_TREE_DATASETS.has(tableName);
}

function readCachedDatabaseCatalogTreeData() {
    const rawTreeData = localStorage.getItem(DATABASE_CATALOG_TREE_CACHE_KEY);
    if (!rawTreeData) return null;

    try {
        const parsedTreeData = JSON.parse(rawTreeData);
        return Array.isArray(parsedTreeData?.nodes) ? parsedTreeData : null;
    } catch (error) {
        console.warn('tree_view_printer: failed to parse cached database catalog tree data', error);
        return null;
    }
}

function persistDatabaseCatalogTreeData(treeData) {
    if (!Array.isArray(treeData?.nodes)) return;
    localStorage.setItem(DATABASE_CATALOG_TREE_CACHE_KEY, JSON.stringify(treeData));
    localStorage.setItem(DATABASE_CATALOG_TREE_CACHE_TS_KEY, String(Date.now()));
}

function isDatabaseCatalogTreeCacheFresh() {
    const cachedAt = Number.parseInt(
        localStorage.getItem(DATABASE_CATALOG_TREE_CACHE_TS_KEY) || '',
        10
    );
    return Number.isFinite(cachedAt)
        && cachedAt > 0
        && Date.now() - cachedAt < DATABASE_CATALOG_TREE_CACHE_TTL_MS;
}

async function loadDatabaseCatalogTreeData() {
    const cachedTreeData = readCachedDatabaseCatalogTreeData();
    if (cachedTreeData?.nodes?.length && isDatabaseCatalogTreeCacheFresh()) {
        return cachedTreeData;
    }

    const fetchedTreeData = await endpoint_router('fetchTreeData');
    persistDatabaseCatalogTreeData(fetchedTreeData);
    return fetchedTreeData;
}

function createTreeRenderHost(treeViewContainer, tableName, treeKind) {
    const treeRenderHost = document.createElement('div');
    treeRenderHost.id = `${tableName}_${treeKind}_tree_render_host`;
    treeViewContainer.replaceChildren(treeRenderHost);
    return treeRenderHost;
}

async function handleDatabaseCatalogTreeButtonClick(nodeData) {
    if (!nodeData?.table_uid && !nodeData?.is_view) return;

    if (nodeData.is_view) {
        const { loadDatabaseView } = await import('../../database_view_fetcher.js');
        history.pushState({}, '', `/${nodeData.name}`);
        await loadDatabaseView(nodeData.name);
        return;
    }

    const { handle_all_navigation } = await import('../../navigation/nav_engine/navigation_handler.js');
    await handle_all_navigation(nodeData.name, []);
}

async function renderDatabaseCatalogTree(tableName, treeViewContainer) {
    const treeRenderHost = createTreeRenderHost(treeViewContainer, tableName, 'database_catalog');

    try {
        const treeData = await loadDatabaseCatalogTreeData();
        const nodes = Array.isArray(treeData?.nodes) ? treeData.nodes : [];

        await render_tree(nodes, {
            container_id: treeRenderHost.id,
            id_suffix: `_${tableName}_database_catalog_tree`,
            render_mode: 'button',
            checkbox_mode: 'none',
            use_icons: false,
            populate_checkbox_selection: false,
            max_recursion_depth: 32,
            tree_model: 'flat',
            initial_open_level: 1,
            show_node_count: true,
            show_search: true,
            use_data_lang_key: true,
            button_action_function: handleDatabaseCatalogTreeButtonClick,
        });
    } catch (error) {
        console.warn('tree_view_printer: failed to render database catalog tree', error);
        treeRenderHost.textContent = 'Puun lataus ei onnistunut.';
    }

    return treeRenderHost;
}

export async function create_tree_view(table_name, columns, data) {
    const tree_view_div = document.getElementById(`${table_name}_tree_view_container`);
    if (!tree_view_div) return null;

    if (shouldRenderDatabaseCatalogTree(table_name)) {
        return await renderDatabaseCatalogTree(table_name, tree_view_div);
    }

    const treeRenderHost = createTreeRenderHost(tree_view_div, table_name, 'dataset_row');

    let id_column = null;
    let parent_column = null;
    for (const col of columns) {
        const lower = col.toLowerCase();
        if (!id_column && lower === 'id') {
            id_column = col;
        }
        if (!parent_column && lower.startsWith('parent_')) {
            parent_column = col;
        }
    }
    if (!id_column) {
        treeRenderHost.innerHTML = '<div>Ei "id"-saraketta – ei puuta.</div>';
        return treeRenderHost;
    }

    // Etsitään name/nimi-sarake
    let name_column = null;
    const name_candidates = columns.filter(c => {
        const lower = c.toLowerCase();
        return lower.includes('name') || lower.includes('nimi');
    });
    if (name_candidates.length > 0) {
        name_column = name_candidates[0];
    }

    // Etsitään type-sarake
    let type_column = null;
    for (const col of columns) {
        if (col.toLowerCase() === 'type') {
            type_column = col;
            break;
        }
    }

    // Rakennetaan "flat"-data
    const tree_data = data.map(row => {
        const typeVal = type_column && row[type_column] ? String(row[type_column]).trim() : '';
        const nameVal = (name_column && row[name_column] != null)
            ? String(row[name_column]).trim()
            : String(row[id_column]); // fallback id:hen

        // Iso alkukirjain ja kaksoispiste
        const nodeLabel = typeVal
            ? `${typeVal.charAt(0).toUpperCase() + typeVal.slice(1)}: ${nameVal}`
            : nameVal;

        return {
            id: row[id_column],
            parent_id: parent_column ? row[parent_column] : null,
            name: nodeLabel
        };
    });

    await render_tree(tree_data, {
        container_id: treeRenderHost.id,
        id_suffix: `_${table_name}_tree`,
        render_mode: 'button',
        checkbox_mode: 'none',
        use_icons: false,
        populate_checkbox_selection: false,
        max_recursion_depth: 64,
        tree_model: 'flat',
        initial_open_level: 2,
        show_node_count: true,
        show_search: true,
        use_data_lang_key: false,
        // button_action_function: (nodeData) => {
        //     // console.log("Klikkasit solmua:", nodeData);
        // }
    });

    return treeRenderHost;
}
