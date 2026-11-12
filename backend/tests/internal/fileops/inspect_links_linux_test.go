package fileops_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
)

func TestChildDirectoriesDoesNotFollowLinks(t *testing.T) {
	parent, outside := t.TempDir(), t.TempDir()
	child := filepath.Join(parent, "child")
	if err := os.Mkdir(child, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(parent, "linked")); err != nil {
		t.Fatal(err)
	}
	directories, err := f.ChildDirectories(parent)
	if err != nil || len(directories) != 1 || directories[0] != child {
		t.Fatalf("%v %v", directories, err)
	}
	if _, err := f.ChildDirectories(filepath.Join(parent, "linked")); err == nil {
		t.Fatal("linked parent accepted")
	}
	path := s.Write(t, child, "real.jpg", "file")
	if err := os.Symlink(path, filepath.Join(child, "linked.jpg")); err != nil {
		t.Fatal(err)
	}
	files, err := f.InputFiles(child)
	if err != nil || len(files) != 1 || files[0] != path {
		t.Fatalf("%v %v", files, err)
	}
}
