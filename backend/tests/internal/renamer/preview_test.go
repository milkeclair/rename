package renamer_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"path/filepath"
	"testing"
)

func TestPreview(t *testing.T) {
	dir := t.TempDir()
	out := t.TempDir()
	source := s.Write(t, dir, "a.txt", "a")
	request := r.Request{Paths: []string{source}, Pattern: "{番号:0000}", Start: 1, OutputDir: out}
	plan := r.Preview(request)
	if plan.Issue != "" || len(plan.Items) != 1 || plan.Items[0].Destination != filepath.Join(out, "0001.txt") {
		t.Fatalf("%+v", plan)
	}
	if s.Read(t, source) != "a" {
		t.Fatal("preview changed source")
	}
	s.Missing(t, plan.Items[0].Destination)
	s.Write(t, out, "0001.txt", "occupied")
	if r.Preview(request).Items[0].Issue == "" {
		t.Fatal("collision missed")
	}
}
func TestPreviewInvalidInputs(t *testing.T) {
	request := r.Request{Paths: []string{filepath.Join(t.TempDir(), "missing")}, Pattern: "{番号}", Start: 1, OutputDir: t.TempDir()}
	if r.Preview(request).Items[0].Issue == "" {
		t.Fatal("missing source accepted")
	}
	request.Start = -1
	if r.Preview(request).Issue == "" {
		t.Fatal("negative number accepted")
	}
	request.Start = 1
	request.OutputDir = ""
	if r.Preview(request).Issue == "" {
		t.Fatal("empty output accepted")
	}
}
