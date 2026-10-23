package scenarios_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"testing"
)

func TestInspectPreviewAndSwap(t *testing.T) {
	dir := t.TempDir()
	first := s.Write(t, dir, "0001.txt", "first")
	second := s.Write(t, dir, "0002.txt", "second")
	entries, err := r.Inspect([]string{second, first})
	if err != nil || len(entries) != 2 {
		t.Fatalf("%v %v", entries, err)
	}
	request := r.Request{Paths: []string{entries[0].Path, entries[1].Path}, Pattern: "{番号:0000}", Start: 1, OutputDir: dir}
	plan := r.Preview(request)
	if plan.Issue != "" || plan.Items[0].Issue != "" || plan.Items[1].Issue != "" {
		t.Fatalf("%+v", plan)
	}
	result := r.Execute(request, nil)
	if result.Issue != "" || result.Items[0].Status != r.StatusDone || result.Items[1].Status != r.StatusDone {
		t.Fatalf("%+v", result)
	}
	if s.Read(t, first) != "second" || s.Read(t, second) != "first" {
		t.Fatal("swap lost contents")
	}
}
