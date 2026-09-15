package product_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/milkeclair/rename/build/resources/product"
)

func TestRead(t *testing.T) {
	info, err := product.Read("../../../../wails.json")
	if err != nil {
		t.Fatal(err)
	}

	if info.Name != "rename" || info.Info.ProductName != "rename" || info.Info.ProductVersion != "0.1.0" {
		t.Fatalf("unexpected product: %+v", info)
	}
}

func TestReadInvalidInput(t *testing.T) {
	path := filepath.Join(t.TempDir(), "wails.json")
	if _, err := product.Read(path); err == nil {
		t.Fatal("missing file accepted")
	}

	if err := os.WriteFile(path, []byte("{"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := product.Read(path); err == nil {
		t.Fatal("invalid JSON accepted")
	}
}
