// row_form_builder.js
// Builds the main add-row form structure for dataset row creation.
// Bridges column metadata and relation metadata into the modal form DOM.
// Exists to centralize how row-creation inputs are assembled before submission.

import { buildForeignKeyField, buildRegularField } from "./row_input_builder.js";
import { buildOneToManySection, buildManyToManySection } from "./row_relation_builder.js";

export function buildMainForm(
    table_name,
    columns,
    oneToManyRelations,
    manyToManyInfos,
    modal_form_state
) {
    const form = document.createElement("form");
    form.id = "add_row_form";
    form.dataset.testid = "add-row-form";
    form.style.display = "flex";
    form.style.flexDirection = "column";

    for (const column of columns) {
        if (column.foreign_table_name) {
            buildForeignKeyField(form, table_name, column, modal_form_state);
        } else {
            buildRegularField(form, table_name, column, modal_form_state);
        }
    }

    // 1->m-suhteet
    modal_form_state["_childRowsArray"] = [];
    buildOneToManySection(form, oneToManyRelations, modal_form_state);

    // m2m-suhteet
    modal_form_state["_manyToManyRows"] = [];
    buildManyToManySection(form, manyToManyInfos, modal_form_state);

    return form;
}
