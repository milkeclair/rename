package renamer_test

import (
	f "github.com/milkeclair/rename/backend/internal/fileops"
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"path/filepath"
	"testing"
)

func TestNewFileMoveAndResult(t *testing.T) {
	item := r.Item{Source: "a", Destination: "b", Issue: "invalid"}
	file := r.NewFileMove(item)
	got := file.Result()
	if got.Source != "a" || got.CurrentPath != "a" || got.Destination != "b" || got.Status != r.StatusPending || got.Issue != "invalid" {
		t.Fatalf("%+v", got)
	}
	got.Issue = "changed"
	if file.Result().Issue != "invalid" {
		t.Fatal("result aliases state")
	}
}
func TestFileMoveStage(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	area := f.NewStagingArea()
	file := r.NewFileMove(r.Item{Source: source, Destination: filepath.Join(dir, "b")})
	if err := file.Stage(&area); err != nil {
		t.Fatal(err)
	}
	if file.Result().CurrentPath == source || file.Result().Status != r.StatusPending {
		t.Fatalf("%+v", file.Result())
	}
	if s.Read(t, file.Result().CurrentPath) != "a" {
		t.Fatal("staged content")
	}
	missing := r.NewFileMove(r.Item{Source: filepath.Join(dir, "missing"), Destination: "b"})
	if err := missing.Stage(&area); err == nil || missing.Result().Status != r.StatusFailed {
		t.Fatal("stage failure missed")
	}
}
func TestFileMoveUnchanged(t *testing.T) {
	source := s.Write(t, t.TempDir(), "a", "a")
	area := f.NewStagingArea()
	file := r.NewFileMove(r.Item{Source: source, Destination: source})
	if err := file.Stage(&area); err != nil {
		t.Fatal(err)
	}
	if err := file.Commit(); err != nil {
		t.Fatal(err)
	}
	file.Restore()
	if file.Result().Status != r.StatusUnchanged || s.Read(t, source) != "a" {
		t.Fatal("unchanged altered")
	}
}
func TestFileMoveCommit(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	destination := filepath.Join(dir, "b")
	file := r.NewFileMove(r.Item{Source: source, Destination: destination})
	if err := file.Commit(); err != nil {
		t.Fatal(err)
	}
	if file.Result().Status != r.StatusDone || file.Result().CurrentPath != destination {
		t.Fatalf("%+v", file.Result())
	}
	file.Restore()
	if s.Read(t, destination) != "a" {
		t.Fatal("completed move restored")
	}
	blocked := r.NewFileMove(r.Item{Source: s.Write(t, dir, "c", "c"), Destination: destination})
	if err := blocked.Commit(); err == nil || blocked.Result().Status != r.StatusFailed {
		t.Fatal("collision missed")
	}
}
func TestFileMoveRestore(t *testing.T) {
	for _, conflict := range []bool{false, true} {
		dir := t.TempDir()
		source := s.Write(t, dir, "a", "a")
		area := f.NewStagingArea()
		file := r.NewFileMove(r.Item{Source: source, Destination: filepath.Join(dir, "b")})
		if err := file.Stage(&area); err != nil {
			t.Fatal(err)
		}
		if conflict {
			s.Write(t, dir, "a", "occupied")
		}
		file.Restore()
		got := file.Result()
		if conflict {
			if got.Issue == "" || got.CurrentPath == source || s.Read(t, source) != "occupied" {
				t.Fatalf("%+v", got)
			}
		} else if got.CurrentPath != source || s.Read(t, source) != "a" {
			t.Fatalf("%+v", got)
		}
	}
}
