package fileops_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestInputFiles(t *testing.T) {
	dir := t.TempDir()
	path := s.Write(t, dir, "a.txt", "a")
	if err := os.Mkdir(filepath.Join(dir, "child"), 0700); err != nil {
		t.Fatal(err)
	}
	s.Write(t, filepath.Join(dir, "child"), "nested", "nested")
	for _, input := range []string{dir, path} {
		got, err := f.InputFiles(input)
		if err != nil || !reflect.DeepEqual(got, []string{path}) {
			t.Fatalf("%v %v", got, err)
		}
	}
	if _, err := f.InputFiles(filepath.Join(dir, "missing")); err == nil {
		t.Fatal("missing accepted")
	}
}
func TestInspectFile(t *testing.T) {
	dir := t.TempDir()
	path := s.Write(t, dir, "a.txt", "a")
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	got, err := f.InspectFile(path)
	want := f.File{Path: path, Name: "a.txt", Directory: dir, CreatedAt: f.CreationTime(info).UnixMilli()}
	if err != nil || got != want {
		t.Fatalf("%+v %v", got, err)
	}
	for _, input := range []string{dir, filepath.Join(dir, "missing")} {
		if _, err := f.InspectFile(input); err == nil {
			t.Fatalf("accepted %s", input)
		}
	}
}
