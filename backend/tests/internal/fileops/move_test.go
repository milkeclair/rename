package fileops_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestMove(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "content")
	destination := filepath.Join(dir, "b")
	outcome, err := f.Move(source, destination)
	if err != nil || !outcome.DestinationCreated || s.Read(t, destination) != "content" {
		t.Fatalf("%+v %v", outcome, err)
	}
	s.Missing(t, source)
	source = s.Write(t, dir, "a", "source")
	outcome, err = f.Move(source, destination)
	if err == nil || outcome.DestinationCreated || s.Read(t, source) != "source" || s.Read(t, destination) != "content" {
		t.Fatal("overwrite")
	}
}
func TestCopyAndRemove(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "content")
	destination := filepath.Join(dir, "b")
	outcome, err := f.CopyAndRemove(source, destination)
	if err != nil || !outcome.DestinationCreated || s.Read(t, destination) != "content" {
		t.Fatalf("%+v %v", outcome, err)
	}
	s.Missing(t, source)
	source = s.Write(t, dir, "a", "source")
	outcome, err = f.CopyAndRemove(source, destination)
	if err == nil || outcome.DestinationCreated || s.Read(t, source) != "source" {
		t.Fatal("collision not preserved")
	}
	files, err := os.ReadDir(dir)
	if err != nil || len(files) != 2 {
		t.Fatalf("temporary left: %v %v", files, err)
	}
}
func TestPrepareCopy(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "content")
	stamp := time.Unix(1700000000, 0)
	if err := os.Chtimes(source, stamp, stamp); err != nil {
		t.Fatal(err)
	}
	input, err := os.Open(source)
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	output, err := os.Create(filepath.Join(dir, "b"))
	if err != nil {
		t.Fatal(err)
	}
	defer output.Close()
	if err := f.PrepareCopy(input, output); err != nil {
		t.Fatal(err)
	}
	info, err := output.Stat()
	if err != nil {
		t.Fatal(err)
	}
	if !info.ModTime().Equal(stamp) || s.Read(t, output.Name()) != "content" {
		t.Fatal("content/time mismatch")
	}
	input.Close()
	if err := f.PrepareCopy(input, output); err == nil {
		t.Fatal("closed input accepted")
	}
}
func TestCopyVerified(t *testing.T) {
	for _, size := range []int64{3, 4} {
		dir := t.TempDir()
		source := s.Write(t, dir, "a", "abc")
		input, err := os.Open(source)
		if err != nil {
			t.Fatal(err)
		}
		output, err := os.Create(filepath.Join(dir, "b"))
		if err != nil {
			t.Fatal(err)
		}
		err = f.CopyVerified(input, output, size)
		input.Close()
		output.Close()
		if (err == nil) != (size == 3) {
			t.Fatalf("size=%d err=%v", size, err)
		}
	}
}
func TestVerifySource(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "abc")
	before, err := os.Stat(source)
	if err != nil {
		t.Fatal(err)
	}
	if err := f.VerifySource(source, before); err != nil {
		t.Fatal(err)
	}
	s.Write(t, dir, "a", "changed")
	if err := f.VerifySource(source, before); err == nil {
		t.Fatal("changed content accepted")
	}
	if err := os.Remove(source); err != nil {
		t.Fatal(err)
	}
	if err := f.VerifySource(source, before); err == nil {
		t.Fatal("missing file accepted")
	}
}
