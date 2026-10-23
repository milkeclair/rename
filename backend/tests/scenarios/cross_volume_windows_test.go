package scenarios_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCrossVolumeRename(t *testing.T) {
	other := os.Getenv("RENAME_TEST_OTHER_DIR")
	if other == "" {
		t.Skip("RENAME_TEST_OTHER_DIR is required for a real second drive")
	}
	destination, err := os.MkdirTemp(other, "rename-")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(destination)
	source := s.Write(t, t.TempDir(), "a.txt", "cross-volume-content")
	stamp := time.Unix(1700000000, 0)
	if err := os.Chtimes(source, stamp, stamp); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(source)
	if err != nil {
		t.Fatal(err)
	}
	target := filepath.Join(destination, "0001.txt")
	if err := f.RenameNoReplace(source, target); !f.IsCrossDevice(err) {
		t.Fatalf("different drive required: %v", err)
	}
	request := r.Request{Paths: []string{source}, Pattern: "{番号:0000}", Start: 1, OutputDir: destination}
	plan := r.Preview(request)
	if plan.Issue != "" || plan.Items[0].Issue != "" {
		t.Fatalf("%+v", plan)
	}
	result := r.Execute(request, nil)
	if result.Issue != "" || result.Items[0].Status != r.StatusDone {
		t.Fatalf("%+v", result)
	}
	if s.Read(t, target) != "cross-volume-content" {
		t.Fatal("content mismatch")
	}
	s.Missing(t, source)
	after, err := os.Stat(target)
	if err != nil {
		t.Fatal(err)
	}
	if !before.ModTime().Equal(after.ModTime()) || !f.CreationTime(before).Equal(f.CreationTime(after)) {
		t.Fatal("timestamps differ")
	}
}
