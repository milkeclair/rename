package fileops_test

import (
	"errors"
	"fmt"
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"golang.org/x/sys/unix"
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestIsCrossDevice(t *testing.T) {
	if !f.IsCrossDevice(unix.EXDEV) || !f.IsCrossDevice(fmt.Errorf("wrapped: %w", unix.EXDEV)) {
		t.Fatal("cross device not recognized")
	}
	if f.IsCrossDevice(nil) || f.IsCrossDevice(errors.New("other")) {
		t.Fatal("wrong error recognized")
	}
}

func TestCreationTime(t *testing.T) {
	path := s.Write(t, t.TempDir(), "a", "a")
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if f.CreationTime(info).IsZero() {
		t.Fatal("missing creation time")
	}
}
func TestRenameNoReplace(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	destination := filepath.Join(dir, "b")
	if err := f.RenameNoReplace(source, destination); err != nil {
		t.Fatal(err)
	}
	s.Missing(t, source)
	s.Write(t, dir, "a", "new")
	if err := f.RenameNoReplace(source, destination); err == nil {
		t.Fatal("overwrite allowed")
	}
	if s.Read(t, destination) != "a" || s.Read(t, source) != "new" {
		t.Fatal("collision damaged content")
	}
	if err := f.RenameNoReplace("bad\x00", destination); err == nil {
		t.Fatal("invalid source accepted")
	}
	if err := f.RenameNoReplace(source, "bad\x00"); err == nil {
		t.Fatal("invalid destination accepted")
	}
}
func TestOpenForCopy(t *testing.T) {
	source := s.Write(t, t.TempDir(), "a", "a")
	file, err := f.OpenForCopy(source)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	data, err := io.ReadAll(file)
	if err != nil || string(data) != "a" {
		t.Fatalf("%s %v", data, err)
	}
	if _, err := f.OpenForCopy(source + "missing"); err == nil {
		t.Fatal("missing source accepted")
	}
}
func TestPreserveTimes(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	stamp := time.Unix(1700000000, 0)
	if err := os.Chtimes(source, stamp, stamp); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(source)
	if err != nil {
		t.Fatal(err)
	}
	file, err := os.Create(filepath.Join(dir, "b"))
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	if err := f.PreserveTimes(file, before); err != nil {
		t.Fatal(err)
	}
	after, err := file.Stat()
	if err != nil {
		t.Fatal(err)
	}
	if !after.ModTime().Equal(before.ModTime()) || !f.CreationTime(after).Equal(f.CreationTime(before)) {
		t.Fatal("timestamps differ")
	}
}
