/* @vitest-environment jsdom */

import { describe, expect, test } from "vitest";
import { collectChildRowsForSubmission, shouldSubmitChildRow } from "./row_submission_handler.js";

describe("shouldSubmitChildRow", () => {
    test("skips empty shared-asset child placeholders", () => {
        expect(shouldSubmitChildRow({
            datasetName: "contracts_assets",
            data: {},
        })).toBe(false);
    });

    test("keeps rows that contain a selected file", () => {
        expect(shouldSubmitChildRow({
            datasetName: "contracts_assets",
            data: {},
            _actualFileObject: { name: "contract.pdf" },
        })).toBe(true);
    });

    test("treats explicit shared-asset metadata as authoritative even without _assets suffix", () => {
        expect(shouldSubmitChildRow({
            datasetName: "contracts_media",
            sharedAssetRelation: true,
            data: {},
            _actualFileObject: { name: "contract.pdf" },
        })).toBe(true);
    });

    test("keeps typed child data for ordinary non-asset child rows", () => {
        expect(shouldSubmitChildRow({
            datasetName: "contracts_notes",
            data: {
                title: "Offer sheet",
            },
        })).toBe(true);
    });

    test("keeps shared-asset rows that contain multiple selected files", () => {
        expect(shouldSubmitChildRow({
            datasetName: "contracts_assets",
            data: {},
            _actualFileObjects: [
                { name: "offer.pdf" },
                { name: "notes.docx" },
            ],
        })).toBe(true);
    });
});

describe("collectChildRowsForSubmission", () => {
    test("expands shared attachment selections into one child row per file", () => {
        const files = [
            new File(["%PDF-1.4"], "offer.pdf", { type: "application/pdf" }),
            new File(["hello"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
        ];

        const { childRowsToSend, childFiles } = collectChildRowsForSubmission([
            {
                datasetName: "contracts_assets",
                referencingColumn: "contract_id",
                data: {},
                fileUploadSpec: {
                    filename_column: "filename",
                    profile_key: "attachment",
                    asset_kinds: ["pdf", "document", "archive"],
                },
                _actualFileObjects: files,
            },
        ]);

        expect(childRowsToSend).toHaveLength(2);
        expect(childFiles).toHaveLength(2);
        expect(childFiles[0]?.name).toBe("offer.pdf");
        expect(childFiles[1]?.name).toBe("notes.docx");
        expect(childRowsToSend[0].data).toMatchObject({
            filename: "offer.pdf",
            original_name: "offer.pdf",
            mime_type: "application/pdf",
            asset_kind: "pdf",
        });
        expect(childRowsToSend[1].data).toMatchObject({
            filename: "notes.docx",
            original_name: "notes.docx",
            asset_kind: "document",
        });
    });

    test("expands explicit shared-asset child rows even when dataset name is not suffixed with _assets", () => {
        const files = [
            new File(["%PDF-1.4"], "offer.pdf", { type: "application/pdf" }),
            new File(["hello"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
        ];

        const { childRowsToSend } = collectChildRowsForSubmission([
            {
                datasetName: "contracts_media",
                sharedAssetRelation: true,
                referencingColumn: "contract_id",
                data: {},
                fileUploadSpec: {
                    filename_column: "filename",
                    profile_key: "attachment",
                    asset_kinds: ["pdf", "document", "archive"],
                },
                _actualFileObjects: files,
            },
        ]);

        expect(childRowsToSend).toHaveLength(2);
        expect(childRowsToSend[0].data.asset_kind).toBe("pdf");
        expect(childRowsToSend[1].data.asset_kind).toBe("document");
    });
});
