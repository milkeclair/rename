package fileops_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"path/filepath"
	"testing"
)

func TestKey(t *testing.T) {
	if f.Key(filepath.Join("A", ".", "B")) != f.Key(filepath.Join("a", "b")) {
		t.Fatal("case/clean mismatch")
	}
	if f.Key("a") == f.Key("b") {
		t.Fatal("different paths collapsed")
	}
}
func TestOutputDirectory(t *testing.T) {
	dir := t.TempDir()
	path := s.Write(t, dir, "file", "x")
	if got, err := f.OutputDirectory(dir); err != nil || got != dir {
		t.Fatalf("%s %v", got, err)
	}
	for _, input := range []string{"", path, filepath.Join(dir, "missing")} {
		if _, err := f.OutputDirectory(input); err == nil {
			t.Fatalf("accepted %q", input)
		}
	}
}
func TestSourcePath(t *testing.T) {
	dir := t.TempDir()
	path := s.Write(t, dir, "file", "x")
	if got, err := f.SourcePath(path); err != nil || got != path {
		t.Fatalf("%s %v", got, err)
	}
	for _, input := range []string{dir, filepath.Join(dir, "missing")} {
		if _, err := f.SourcePath(input); err == nil {
			t.Fatalf("accepted %q", input)
		}
	}
}
func TestReadDestination(t *testing.T) {
	dir := t.TempDir()
	path := s.Write(t, dir, "file", "x")
	for _, input := range []string{dir, path} {
		got := f.ReadDestination(input)
		if !got.Exists || got.Err != nil {
			t.Fatalf("%+v", got)
		}
	}
	if got := f.ReadDestination(filepath.Join(dir, "missing")); got.Exists || got.Err != nil {
		t.Fatalf("%+v", got)
	}
	if got := f.ReadDestination("bad\x00name"); got.Err == nil {
		t.Fatal("invalid path accepted")
	}
}
