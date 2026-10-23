package fileops_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
)

func TestNewStagingArea(t *testing.T) {
	area := f.NewStagingArea()
	if issue := area.Cleanup(); issue != "" {
		t.Fatal(issue)
	}
}
func TestStagingAreaPlace(t *testing.T) {
	dir := t.TempDir()
	area := f.NewStagingArea()
	first, err := area.Place(s.Write(t, dir, "a", "a"))
	if err != nil {
		t.Fatal(err)
	}
	second, err := area.Place(s.Write(t, dir, "b", "b"))
	if err != nil {
		t.Fatal(err)
	}
	if filepath.Dir(first) != filepath.Dir(second) || s.Read(t, first) != "a" {
		t.Fatal("staging mismatch")
	}
	s.Missing(t, filepath.Join(dir, "a"))
	if _, err := area.Place(filepath.Join(dir, "missing")); err == nil {
		t.Fatal("missing staged")
	}
}
func TestStagingAreaCleanup(t *testing.T) {
	area := f.NewStagingArea()
	source := s.Write(t, t.TempDir(), "a", "a")
	staged, err := area.Place(source)
	if err != nil {
		t.Fatal(err)
	}
	if issue := area.Cleanup(); issue == "" {
		t.Fatal("nonempty staging deleted")
	}
	if s.Read(t, staged) != "a" {
		t.Fatal("content lost")
	}
	if err := os.Remove(staged); err != nil {
		t.Fatal(err)
	}
	if issue := area.Cleanup(); issue != "" {
		t.Fatal(issue)
	}
	s.Missing(t, filepath.Dir(staged))
	if issue := area.Cleanup(); issue != "" {
		t.Fatal(issue)
	}
}
