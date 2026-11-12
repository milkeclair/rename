package generation_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/milkeclair/rename/build/resources/generation"
)

func TestGenerate(t *testing.T) {
	output := filepath.Join(t.TempDir(), "generated")
	if err := generation.Generate("../../../../wails.json", "../../../windows", output, ""); err != nil {
		t.Fatal(err)
	}

	for file, want := range map[string]string{
		"rename.manifest": `name="com.wails.rename"`,
		"rename.rc":       "FILEVERSION 0,1,0,0",
	} {
		data, err := os.ReadFile(filepath.Join(output, file))
		if err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(string(data), want) {
			t.Fatalf("%s lacks %q", file, want)
		}
	}
}

func TestGenerateFailure(t *testing.T) {
	output := t.TempDir()
	if err := generation.Generate("missing.json", "../../../windows", output, ""); err == nil {
		t.Fatal("missing product accepted")
	}
	if err := generation.Generate("../../../../wails.json", "missing", output, ""); err == nil {
		t.Fatal("missing templates accepted")
	}

	blocked := filepath.Join(output, "file")
	if err := os.WriteFile(blocked, nil, 0600); err != nil {
		t.Fatal(err)
	}
	if err := generation.Generate("../../../../wails.json", "../../../windows", blocked, ""); err == nil {
		t.Fatal("file accepted as output directory")
	}
}

func TestGenerateVersion(t *testing.T) {
	for _, version := range []string{"2.3.4", "0.0.0", "65535.65535.65535"} {
		t.Run(version, func(t *testing.T) {
			output := t.TempDir()
			if err := generation.Generate("../../../../wails.json", "../../../windows", output, version); err != nil {
				t.Fatal(err)
			}
			manifest, err := os.ReadFile(filepath.Join(output, "rename.manifest"))
			if err != nil {
				t.Fatal(err)
			}
			if !strings.Contains(string(manifest), `version="`+version+`.0"`) {
				t.Fatal(string(manifest))
			}
			rc, err := os.ReadFile(filepath.Join(output, "rename.rc"))
			if err != nil {
				t.Fatal(err)
			}
			want := "FILEVERSION " + strings.ReplaceAll(version, ".", ",") + ",0"
			if !strings.Contains(string(rc), want) {
				t.Fatalf("missing %q", want)
			}
		})
	}
}

func TestGenerateInvalidVersion(t *testing.T) {
	for _, version := range []string{"1.2", "1.2.3.4", "v1.2.3", "1.2.3-rc.1", "01.2.3", "-1.2.3", "1.2.65536", "a.b.c"} {
		t.Run(version, func(t *testing.T) {
			output := filepath.Join(t.TempDir(), "generated")
			if err := generation.Generate("../../../../wails.json", "../../../windows", output, version); err == nil {
				t.Fatal("invalid version accepted")
			}
			if _, err := os.Stat(output); !os.IsNotExist(err) {
				t.Fatalf("generated files for invalid input: %v", err)
			}
		})
	}
}
