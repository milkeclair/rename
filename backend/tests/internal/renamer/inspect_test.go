package renamer_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
)

func TestInspect(t *testing.T) {
	dir := t.TempDir()
	other := t.TempDir()
	path := s.Write(t, dir, "a.txt", "a")
	s.Write(t, other, "a.txt", "b")
	if err := os.Mkdir(filepath.Join(dir, "sub"), 0700); err != nil {
		t.Fatal(err)
	}
	s.Write(t, filepath.Join(dir, "sub"), "nested.txt", "nested")
	got, err := r.Inspect([]string{dir, path, other})
	if err != nil || len(got) != 2 {
		t.Fatalf("%+v %v", got, err)
	}
	if got[0].Name != "a.txt" || got[0].Directory != dir || got[0].Path != path {
		t.Fatalf("%+v", got[0])
	}
}
func TestInspectEmptyAndMissing(t *testing.T) {
	got, err := r.Inspect(nil)
	if err != nil || got == nil || len(got) != 0 {
		t.Fatalf("%v %v", got, err)
	}
	if _, err := r.Inspect([]string{filepath.Join(t.TempDir(), "missing")}); err == nil {
		t.Fatal("missing accepted")
	}
}

func TestInspectChildren(t *testing.T) {
	parent := t.TempDir()
	for _, child := range []string{"1", "2", "empty"} {
		if err := os.Mkdir(filepath.Join(parent, child), 0700); err != nil {
			t.Fatal(err)
		}
	}
	first := s.Write(t, filepath.Join(parent, "1"), "1.jpg", "first")
	second := s.Write(t, filepath.Join(parent, "1"), "2.jpg", "second")
	third := s.Write(t, filepath.Join(parent, "2"), "1.jpg", "third")
	fourth := s.Write(t, filepath.Join(parent, "2"), "2.jpg", "fourth")
	s.Write(t, parent, "root.jpg", "excluded")
	nested := filepath.Join(parent, "1", "nested")
	if err := os.Mkdir(nested, 0700); err != nil {
		t.Fatal(err)
	}
	s.Write(t, nested, "deep.jpg", "excluded")
	entries, err := r.InspectChildren(parent)
	want := []string{first, second, third, fourth}
	if err != nil || len(entries) != len(want) {
		t.Fatalf("%+v %v", entries, err)
	}
	for index, entry := range entries {
		if entry.Path != want[index] || entry.Directory != filepath.Dir(want[index]) {
			t.Fatalf("%+v", entries)
		}
	}
}

func TestInspectChildrenEmptyAndInvalid(t *testing.T) {
	parent := t.TempDir()
	entries, err := r.InspectChildren(parent)
	if err != nil || entries == nil || len(entries) != 0 {
		t.Fatalf("%v %v", entries, err)
	}
	file := s.Write(t, parent, "file.jpg", "file")
	for _, input := range []string{file, filepath.Join(parent, "missing")} {
		if _, err := r.InspectChildren(input); err == nil {
			t.Fatalf("accepted %s", input)
		}
	}
}
