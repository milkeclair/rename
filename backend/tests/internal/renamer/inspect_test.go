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
