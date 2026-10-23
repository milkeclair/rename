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
	if err := generation.Generate("../../../../wails.json", "../../../windows", output); err != nil {
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
	if err := generation.Generate("missing.json", "../../../windows", output); err == nil {
		t.Fatal("missing product accepted")
	}
	if err := generation.Generate("../../../../wails.json", "missing", output); err == nil {
		t.Fatal("missing templates accepted")
	}

	blocked := filepath.Join(output, "file")
	if err := os.WriteFile(blocked, nil, 0600); err != nil {
		t.Fatal(err)
	}
	if err := generation.Generate("../../../../wails.json", "../../../windows", blocked); err == nil {
		t.Fatal("file accepted as output directory")
	}
}
