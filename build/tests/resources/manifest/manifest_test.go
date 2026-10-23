package manifest_test

import (
	"encoding/xml"
	"os"
	"path/filepath"
	"testing"

	"github.com/milkeclair/rename/build/resources/manifest"
)

func TestLoad(t *testing.T) {
	got, err := manifest.Load("../../../windows/wails.exe.manifest", "test-product", "2.3.4")
	if err != nil {
		t.Fatal(err)
	}

	var document struct {
		Identity struct {
			Name    string `xml:"name,attr"`
			Version string `xml:"version,attr"`
		} `xml:"assemblyIdentity"`
		Settings struct {
			DPIAware     string `xml:"dpiAware"`
			DPIAwareness string `xml:"dpiAwareness"`
		} `xml:"application>windowsSettings"`
		Controls struct {
			Name    string `xml:"name,attr"`
			Version string `xml:"version,attr"`
		} `xml:"dependency>dependentAssembly>assemblyIdentity"`
	}
	if err := xml.Unmarshal(got, &document); err != nil {
		t.Fatal(err)
	}

	if document.Identity.Name != "com.wails.test-product" || document.Identity.Version != "2.3.4.0" {
		t.Fatalf("identity: %+v", document.Identity)
	}

	if document.Settings.DPIAware != "true/pm" || document.Settings.DPIAwareness != "permonitorv2,permonitor" {
		t.Fatalf("DPI fallback changed: %+v", document.Settings)
	}

	if document.Controls.Name != "Microsoft.Windows.Common-Controls" || document.Controls.Version != "6.0.0.0" {
		t.Fatalf("controls: %+v", document.Controls)
	}
}

func TestLoadInvalidInput(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "manifest.xml")
	if _, err := manifest.Load(path, "rename", "0.1.0"); err == nil {
		t.Fatal("missing file accepted")
	}

	for _, source := range []string{"{{", "{{.Missing}}", "<assembly>"} {
		if err := os.WriteFile(path, []byte(source), 0600); err != nil {
			t.Fatal(err)
		}

		if _, err := manifest.Load(path, "rename", "0.1.0"); err == nil {
			t.Fatalf("invalid input accepted: %q", source)
		}
	}
}
