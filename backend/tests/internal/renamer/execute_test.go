package renamer_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"testing"
)

func TestExecute(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a.txt", "a")
	result := r.Execute(r.Request{Paths: []string{source}, Pattern: "{番号:0000}", Start: 1, OutputDir: dir}, nil)
	if result.Issue != "" || result.Items[0].Status != r.StatusDone {
		t.Fatalf("%+v", result)
	}
	if s.Read(t, filepath.Join(dir, "0001.txt")) != "a" {
		t.Fatal("content mismatch")
	}
}
func TestExecuteInvalidPlan(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	result := r.Execute(r.Request{Paths: []string{source}, Pattern: "bad", Start: 1, OutputDir: dir}, nil)
	if result.Issue == "" || s.Read(t, source) != "a" {
		t.Fatal("invalid plan executed")
	}
}
func TestNewBatch(t *testing.T) {
	for _, plan := range []r.Plan{{Items: []r.Item{}, Issue: "invalid"}, {Items: []r.Item{{Source: "a", Issue: "bad"}}}} {
		batch := r.NewBatch(plan, nil)
		if batch.Result().Issue == "" {
			t.Fatal("plan error lost")
		}
	}
}
func TestBatchRun(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: filepath.Join(dir, "b")}}}, nil)
	batch.Run()
	if batch.Result().Items[0].Status != r.StatusDone {
		t.Fatalf("%+v", batch.Result())
	}
	files, err := os.ReadDir(dir)
	if err != nil || len(files) != 1 {
		t.Fatalf("staging left %v %v", files, err)
	}
}
func TestBatchStageAllAndRestorePending(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: filepath.Join(dir, "b")}, {Source: filepath.Join(dir, "missing"), Destination: filepath.Join(dir, "c")}}}, nil)
	if batch.StageAll() {
		t.Fatal("missing source accepted")
	}
	if batch.Result().Issue == "" {
		t.Fatal("stage error missing")
	}
	batch.RestorePending()
	if s.Read(t, source) != "a" {
		t.Fatal("pending not restored")
	}
	batch.RemoveStagingDirectories()
}
func TestBatchMoveAll(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	progress := []r.Progress{}
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: filepath.Join(dir, "b")}}}, func(value r.Progress) { progress = append(progress, value) })
	if !batch.StageAll() {
		t.Fatal("stage failed")
	}
	batch.MoveAll()
	if len(progress) != 1 || progress[0].Completed != 1 || progress[0].Total != 1 || progress[0].Name != "b" {
		t.Fatalf("%+v", progress)
	}
	if batch.Result().Items[0].Status != r.StatusDone {
		t.Fatal("not done")
	}
	batch.RemoveStagingDirectories()
}
func TestBatchRemoveStagingDirectoriesAndResult(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: filepath.Join(dir, "b")}}}, nil)
	before := batch.Result()
	if !batch.StageAll() {
		t.Fatal("stage failed")
	}
	batch.RemoveStagingDirectories()
	if batch.Result().Issue == "" {
		t.Fatal("nonempty directory failure missed")
	}
	if before.Issue != "" || before.Items[0].CurrentPath != source {
		t.Fatal("published result changed")
	}
	batch.RestorePending()
	batch.RemoveStagingDirectories()
}

func TestBatchRunRestoresAfterStageFailure(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: filepath.Join(dir, "b")}, {Source: filepath.Join(dir, "missing"), Destination: filepath.Join(dir, "c")}}}, nil)
	batch.Run()
	if batch.Result().Issue == "" || s.Read(t, source) != "a" {
		t.Fatal("failed batch did not restore source")
	}
}
func TestBatchMoveAllStopsOnConflict(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	target := s.Write(t, dir, "b", "occupied")
	reported := 0
	batch := r.NewBatch(r.Plan{Items: []r.Item{{Source: source, Destination: target}}}, func(r.Progress) { reported++ })
	if !batch.StageAll() {
		t.Fatal("stage failed")
	}
	batch.MoveAll()
	if batch.Result().Issue == "" || reported != 0 {
		t.Fatal("failed move reported as completed")
	}
	batch.RestorePending()
	batch.RemoveStagingDirectories()
	if s.Read(t, source) != "a" || s.Read(t, target) != "occupied" {
		t.Fatal("conflict changed files")
	}
}
