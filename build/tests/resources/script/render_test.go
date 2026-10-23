package script_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/milkeclair/rename/build/resources/product"
	"github.com/milkeclair/rename/build/resources/script"
)

func TestRender(t *testing.T) {
	var info product.Info
	info.Info.ProductVersion = "2.3.4"
	info.Info.ProductName = "日本語 \"名前\" \\"
	info.Info.Comments = "first\nsecond\r\t"

	got, err := script.Render("../../../windows/rename.rc", info)
	if err != nil {
		t.Fatal(err)
	}

	for _, want := range []string{
		"FILEVERSION 2,3,4,0",
		"PRODUCTVERSION 2,3,4,0",
		`VALUE "ProductName", "日本語 \"名前\" \\"`,
		`VALUE "Comments", "first\nsecond\r\t"`,
		`1 24 "rename.manifest"`,
		`VALUE "Translation", 0, 1200`,
	} {
		if !strings.Contains(string(got), want) {
			t.Fatalf("missing %q in %s", want, got)
		}
	}
}

func TestRenderInvalidTemplate(t *testing.T) {
	path := filepath.Join(t.TempDir(), "rename.rc")
	if _, err := script.Render(path, product.Info{}); err == nil {
		t.Fatal("missing file accepted")
	}

	for _, source := range []string{"{{", "{{.Missing}}"} {
		if err := os.WriteFile(path, []byte(source), 0600); err != nil {
			t.Fatal(err)
		}
		if _, err := script.Render(path, product.Info{}); err == nil {
			t.Fatalf("invalid template accepted: %q", source)
		}
	}
}
