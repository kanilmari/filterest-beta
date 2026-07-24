// @vitest-environment jsdom
// map_view_printer.test.js
// Verifies coordinate inference and synchronized map/list selection for the map table view.
// Bridges jsdom-rendered controls and the dependency-free coordinate extraction helpers.
// Exists to keep map view row placement stable across supported coordinate shapes.

import { beforeEach, describe, expect, test } from "vitest";
import { create_map_view, dataset_supports_map_view, extract_map_points } from "./map_view_printer.js";

describe("map_view_printer", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    test("extracts explicit coordinate column pairs by supported aliases", () => {
        const cases = [
            {
                columns: ["id", "latitude", "longitude"],
                row: { id: 1, latitude: "60.1699", longitude: "24.9384" },
                sourceLabel: "latitude/longitude",
            },
            {
                columns: ["id", "lat", "lon"],
                row: { id: 2, lat: 61.4978, lon: 23.761 },
                sourceLabel: "lat/lon",
            },
            {
                columns: ["id", "lat", "lng"],
                row: { id: 3, lat: "62,2426", lng: "25,7473" },
                sourceLabel: "lat/lng",
            },
            {
                columns: ["id", "y", "x"],
                row: { id: 4, y: "65.0121", x: "25.4651" },
                sourceLabel: "y/x",
            },
        ];

        cases.forEach(({ columns, row, sourceLabel }) => {
            const points = extract_map_points(columns, [row]);

            expect(points).toHaveLength(1);
            expect(points[0].sourceLabel).toBe(sourceLabel);
            expect(points[0].latitude).toBeCloseTo(Number(String(row[columns[1]]).replace(",", ".")));
            expect(points[0].longitude).toBeCloseTo(Number(String(row[columns[2]]).replace(",", ".")));
        });
    });

    test("extracts coordinates from POINT and JSON-like position fields", () => {
        const points = extract_map_points(
            ["id", "position"],
            [
                { id: 1, position: "POINT(24.9384 60.1699)" },
                { id: 2, position: "{\"latitude\":61.4978,\"longitude\":23.761}" },
                { id: 3, position: "{lat: 62.2426, lng: 25.7473}" },
            ]
        );

        expect(points).toHaveLength(3);
        expect(points[0].latitude).toBeCloseTo(60.1699);
        expect(points[0].longitude).toBeCloseTo(24.9384);
        expect(points[1].latitude).toBeCloseTo(61.4978);
        expect(points[1].longitude).toBeCloseTo(23.761);
        expect(points[2].latitude).toBeCloseTo(62.2426);
        expect(points[2].longitude).toBeCloseTo(25.7473);
    });

    test("extracts app service location coordinates from hidden EWKB position fields", () => {
        const ewkbPoint = "0101000020E610000000917EFB3AF0384092CB7F48BF154E40";
        const serviceLocationRow = {
            id: 10,
            street_address: "Mannerheimintie 1",
            postal_code: "00100",
            city: "Helsinki",
            position: `\\x${ewkbPoint}`,
        };

        const points = extract_map_points(
            ["id", "street_address", "postal_code", "city"],
            [serviceLocationRow]
        );

        expect(points).toHaveLength(1);
        expect(points[0].sourceLabel).toBe("position");
        expect(points[0].latitude).toBeCloseTo(60.1699);
        expect(points[0].longitude).toBeCloseTo(24.9384);

        const view = create_map_view(
            "app_service_locations",
            ["id", "street_address", "postal_code", "city"],
            [serviceLocationRow],
            {}
        );

        expect(view.querySelector(".map-view-empty")).toBeNull();
        expect(view.querySelector(".map-view-plane")?.dataset.mapProvider).toBe("OpenStreetMap");
        expect(view.querySelector(".map-view-tile")).not.toBeNull();
        expect(view.querySelector(".map-view-attribution")?.textContent)
            .toContain("OpenStreetMap");
        expect(view.querySelector(".map-view-row-title")?.textContent)
            .toBe("Mannerheimintie 1, 00100 Helsinki");
        expect(view.querySelector(".map-view-row-source")?.textContent)
            .toContain("position");
        expect(view.querySelector(".map-view-marker-button")?.title)
            .toContain("Mannerheimintie 1, 00100 Helsinki");
    });

    test("keeps rows without coordinates visible outside the plotted markers", () => {
        const view = create_map_view(
            "places",
            ["id", "name", "lat", "lng"],
            [
                { id: 1, name: "Library", lat: 60.17, lng: 24.94 },
                { id: 2, name: "No location yet", lat: "", lng: "" },
                { id: 3, name: "Also missing" },
            ],
            {}
        );

        expect(view.querySelectorAll(".map-view-marker-button")).toHaveLength(1);
        expect(view.querySelector(".map-view-status")?.textContent).toContain("1/3");
        expect(view.querySelector(".map-view-status")?.textContent).toContain("2 without coordinates");
        expect(view.querySelector(".map-view-missing-rows summary")?.textContent)
            .toBe("Rows without coordinates 2");
        expect(view.querySelector(".map-view-missing-row-list")?.textContent)
            .toContain("No location yet");
    });

    test("extracts explicit coordinate pairs from row keys outside visible columns", () => {
        const points = extract_map_points(
            ["id", "name"],
            [{ id: 2, name: "Hidden coordinate row", latitude: "61.4978", longitude: "23.761" }]
        );

        expect(points).toHaveLength(1);
        expect(points[0].sourceLabel).toBe("latitude/longitude");
        expect(points[0].latitude).toBeCloseTo(61.4978);
        expect(points[0].longitude).toBeCloseTo(23.761);
    });

    test("reports map support only for geospatial datasets or coordinate-bearing rows", () => {
        expect(dataset_supports_map_view(
            ["id", "title"],
            [{ id: 1, title: "Brave" }],
            { id: { data_type: "integer" }, title: { data_type: "text" } },
            false
        )).toBe(false);
        expect(dataset_supports_map_view(
            ["id", "title"],
            [{ id: 1, title: "Missing point", position: null }],
            { id: { data_type: "integer" }, position: { data_type: "geometry" } },
            false
        )).toBe(true);
        expect(dataset_supports_map_view(
            ["id", "lat", "lng"],
            [{ id: 1, lat: "", lng: "" }],
            {},
            false
        )).toBe(true);
        expect(dataset_supports_map_view(
            ["id", "title"],
            [{ id: 1, title: "Service location" }],
            {},
            true
        )).toBe(true);
    });

    test("renders an empty state when rows do not contain valid coordinates", () => {
        const view = create_map_view(
            "places",
            ["id", "name", "lat", "lng"],
            [
                { id: 1, name: "Out of range", lat: 120, lng: 24 },
                { id: 2, name: "Missing longitude", lat: 60, lng: "" },
            ],
            {}
        );

        expect(view.querySelector(".map-view-marker-button")).toBeNull();
        expect(view.querySelector("[data-lang-key=\"map_view_no_coordinates_title\"]")?.textContent)
            .toBe("No coordinates found");
    });

    test("keeps marker and row-list selection synchronized", () => {
        const view = create_map_view(
            "places",
            ["id", "name", "lat", "lng"],
            [
                { id: 1, name: "Library", lat: 60.17, lng: 24.94 },
                { id: 2, name: "Harbor", lat: 60.16, lng: 24.96 },
            ],
            {}
        );
        document.body.appendChild(view);

        const markers = Array.from(view.querySelectorAll(".map-view-marker-button"));
        const rows = Array.from(view.querySelectorAll(".map-view-row-button"));

        expect(markers).toHaveLength(2);
        expect(rows).toHaveLength(2);
        expect(markers[0].classList.contains("map-view-is-selected")).toBe(true);
        expect(rows[0].classList.contains("map-view-is-selected")).toBe(true);

        rows[1].click();

        expect(markers[0].classList.contains("map-view-is-selected")).toBe(false);
        expect(rows[0].classList.contains("map-view-is-selected")).toBe(false);
        expect(markers[1].classList.contains("map-view-is-selected")).toBe(true);
        expect(rows[1].classList.contains("map-view-is-selected")).toBe(true);
        expect(rows[1].textContent).toContain("Harbor");
    });
});
