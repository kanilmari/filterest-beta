package dtt_1_row_create

import (
	dtt_asset_linking "easelect/backend/core_components/dynamic_table_tools/dtt_asset_linking"
	"easelect/backend/core_components/media_utils"
	"os"
	"path/filepath"
	"testing"
)

func TestResolveAllowedExtensionsUsesConfigTypes(t *testing.T) {
	config := dtt_asset_linking.FileUploadConfig{
		AllowedFileTypes: []string{"pdf", ".docx", "zip"},
	}

	allowed := resolveAllowedExtensions(config)

	for _, ext := range []string{"pdf", "docx", "zip"} {
		if !isAllowedExtension(ext, allowed) {
			t.Fatalf("expected %q to be allowed", ext)
		}
	}
	if isAllowedExtension("png", allowed) {
		t.Fatal("did not expect png to be allowed when explicit attachment extensions were provided")
	}
}

func TestResolveAllowedExtensionsFallsBackToImageDefaults(t *testing.T) {
	allowed := resolveAllowedExtensions(dtt_asset_linking.FileUploadConfig{})

	for ext := range media_utils.AllowedImageExtensions {
		if !isAllowedExtension(ext, allowed) {
			t.Fatalf("expected image extension %q to be allowed", ext)
		}
	}
}

func TestRequiredUploadSubfoldersForAttachment(t *testing.T) {
	config := dtt_asset_linking.FileUploadConfig{
		ProfileKey: dtt_asset_linking.AssetProfileAttachment,
		AssetKinds: []dtt_asset_linking.AssetKind{dtt_asset_linking.AssetKindPDF},
	}

	subfolders := requiredUploadSubfolders(config)
	if len(subfolders) != 1 || subfolders[0] != "original" {
		t.Fatalf("requiredUploadSubfolders(%#v) = %#v, want []string{\"original\"}", config, subfolders)
	}
}

func TestRequiredUploadSubfoldersForImage(t *testing.T) {
	config := dtt_asset_linking.FileUploadConfig{
		ProfileKey: dtt_asset_linking.AssetProfileImage,
		AssetKinds: []dtt_asset_linking.AssetKind{dtt_asset_linking.AssetKindImage},
	}

	subfolders := requiredUploadSubfolders(config)
	if len(subfolders) != len(media_utils.RequiredSubfolders) {
		t.Fatalf("requiredUploadSubfolders image len = %d, want %d", len(subfolders), len(media_utils.RequiredSubfolders))
	}
	for i, want := range media_utils.RequiredSubfolders {
		if subfolders[i] != want {
			t.Fatalf("requiredUploadSubfolders[%d] = %q, want %q", i, subfolders[i], want)
		}
	}
}

func TestCreateImageDisplayVariantCopiesBrowserImageWithoutLocalDecoder(t *testing.T) {
	if !shouldCopySourceAsDisplayVariant("example.avif") {
		t.Fatal("expected avif to use passthrough display variant")
	}
	if shouldCopySourceAsDisplayVariant("example.png") {
		t.Fatal("did not expect png to use passthrough display variant")
	}

	tempDir := t.TempDir()
	sourcePath := filepath.Join(tempDir, "original.avif")
	destinationPath := filepath.Join(tempDir, "400", "original.avif")
	sourceBytes := []byte("fake-avif-bytes")

	if err := os.WriteFile(sourcePath, sourceBytes, 0o644); err != nil {
		t.Fatalf("write source: %v", err)
	}
	if err := CreateImageDisplayVariant(sourcePath, destinationPath, 300); err != nil {
		t.Fatalf("CreateImageDisplayVariant returned error: %v", err)
	}

	gotBytes, err := os.ReadFile(destinationPath)
	if err != nil {
		t.Fatalf("read destination: %v", err)
	}
	if string(gotBytes) != string(sourceBytes) {
		t.Fatalf("fallback bytes = %q, want %q", string(gotBytes), string(sourceBytes))
	}
}

func TestResolveUploadStorageCoordinatesUsesParentContextForDirectSharedAssets(t *testing.T) {
	tableUID, rowID, err := resolveUploadStorageCoordinates(
		"2758",
		9,
		false,
		dtt_asset_linking.SharedAssetParentStorageContext{
			ParentTableUID: "104",
			ParentRowID:    41,
		},
	)
	if err != nil {
		t.Fatalf("resolveUploadStorageCoordinates returned error: %v", err)
	}
	if tableUID != "104" || rowID != 41 {
		t.Fatalf("resolveUploadStorageCoordinates = (%q, %d), want (104, 41)", tableUID, rowID)
	}
}

func TestResolveUploadStorageCoordinatesFallsBackWhenNoParentContextExists(t *testing.T) {
	tableUID, rowID, err := resolveUploadStorageCoordinates(
		"2758",
		9,
		false,
		dtt_asset_linking.SharedAssetParentStorageContext{},
	)
	if err != nil {
		t.Fatalf("resolveUploadStorageCoordinates returned error: %v", err)
	}
	if tableUID != "2758" || rowID != 9 {
		t.Fatalf("resolveUploadStorageCoordinates fallback = (%q, %d), want (2758, 9)", tableUID, rowID)
	}
}
