// row_creation_handler.js
// Opens and orchestrates the add-row modal, fetching schema and wiring form submission.
// Bridges row_api_fetcher, row_form_builder, and row_submission_handler into a single flow.
// Exists to keep row-creation orchestration separate from individual build and fetch concerns.

import {
    createModal,
    showModal,
} from "../../../../reusable_components/modal/modal_builder.js";
import {
    fetchColumnsInfo,
    fetchOneToManyRelations,
    fetchManyToManyInfos,
    getDatasetNameByUID
} from "./row_api_fetcher.js";
import { buildMainForm } from "./row_form_builder.js";
import { appendFormActions } from "./row_submission_handler.js";
import { showWarningToast } from "../../../../reusable_components/notifications/toast_notification_printer.js";
import { getTranslationForKey } from "../../../lang/translation_handler.js";

// Säilytetään lomakkeen tilaa globaalisti (tässä moduulissa)
let modal_form_state = {};

function clearState() {
    modal_form_state = {};
}

// Auto-resize logiikka kaikille textareille
document.addEventListener("input", (event) => {
    if (event.target.classList.contains("auto_resize_textarea")) {
        event.target.style.height = "auto";
        event.target.style.height = event.target.scrollHeight + "px";
    }
});

/**
 * -----------------------------------------------
 *   OHJAUSFUNKTIO: avaa rivinlisäyslomakkeen
 * -----------------------------------------------
 */
export async function open_add_row_modal(table_uid, table_name) {
    const datasetName = table_name || getDatasetNameByUID(table_uid);

    // 1) Haetaan saraketiedot
    const columns_info = await fetchColumnsInfo(table_uid);
    if (!columns_info || columns_info.length === 0) {
        console.warn("No column information received.");
        showWarningToast(getTranslationForKey('no_columns_available') || "Taululle ei ole saatavilla sarakkeita.");
        return;
    }

    // 2) Ei enää frontin filtteröintiä – käytetään sellaisenaan backendistä saatuja sarakkeita
    const columns = columns_info;
    if (!columns || columns.length === 0) {
        console.warn("No columns available to display in the modal.");
        showWarningToast(getTranslationForKey('no_columns_to_add') || "Taululle ei ole lisättäviä sarakkeita.");
        return;
    }

    // 3) Haetaan 1->m-suhteet ja monesta->moneen -liitokset
    let oneToManyRelations = await fetchOneToManyRelations(table_uid);
    let manyToManyInfos = await fetchManyToManyInfos(table_uid);

    if (!oneToManyRelations) oneToManyRelations = [];
    if (!manyToManyInfos) manyToManyInfos = [];

    // 4) Rakennetaan lomake
    // Pass modal_form_state to buildMainForm
    const form = buildMainForm(
        datasetName,
        columns,
        oneToManyRelations,
        manyToManyInfos,
        modal_form_state
    );

    // 5) Lomakkeen loppuun painikkeet ja submit
    // Pass modal_form_state and clearState callback
    appendFormActions(form, table_uid, columns, modal_form_state, clearState);

    // 6) Luodaan ja näytetään modaalinen ikkuna
    createModal({
        titleDataLangKey: `add_row_${datasetName}`,
        titleDataLangKeyFallback: `add_row`,
        contentElements: [form],
        width: "600px",
    });
    showModal();
}
