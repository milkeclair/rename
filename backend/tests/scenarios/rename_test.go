package scenarios_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"os"
	"path/filepath"
	"strconv"
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

func TestChildFoldersRenameIntoOneOutput(t *testing.T) {
	parent, output := t.TempDir(), t.TempDir()
	var sources []string
	contents := []string{"first", "second", "third", "fourth"}
	for index, child := range []string{"1", "2"} {
		dir := filepath.Join(parent, child)
		if err := os.Mkdir(dir, 0700); err != nil {
			t.Fatal(err)
		}
		for file := 0; file < 2; file++ {
			sources = append(sources, s.Write(t, dir, strconv.Itoa(file+1)+".jpg", contents[index*2+file]))
		}
	}
	root := s.Write(t, parent, "root.jpg", "excluded")
	entries, err := r.InspectChildren(parent)
	if err != nil || len(entries) != 4 {
		t.Fatalf("%+v %v", entries, err)
	}
	request := r.Request{Pattern: "{番号}", Start: 1, OutputDir: output}
	for _, entry := range entries {
		request.Paths = append(request.Paths, entry.Path)
	}
	plan := r.Preview(request)
	if plan.Issue != "" || len(plan.Items) != 4 {
		t.Fatalf("%+v", plan)
	}
	result := r.Execute(request, nil)
	if result.Issue != "" || len(result.Items) != 4 {
		t.Fatalf("%+v", result)
	}
	for index, content := range contents {
		name := strconv.Itoa(index+1) + ".jpg"
		if result.Items[index].Status != r.StatusDone || plan.Items[index].Name != name || s.Read(t, filepath.Join(output, name)) != content {
			t.Fatalf("%+v", result)
		}
		if _, err := os.Lstat(sources[index]); !os.IsNotExist(err) {
			t.Fatalf("source remains: %s %v", sources[index], err)
		}
	}
	if s.Read(t, root) != "excluded" {
		t.Fatal("parent file changed")
	}
}

func TestChildFoldersOutputCollisionPreservesEverySource(t *testing.T) {
	parent, output := t.TempDir(), t.TempDir()
	var paths []string
	for _, child := range []string{"1", "2"} {
		dir := filepath.Join(parent, child)
		if err := os.Mkdir(dir, 0700); err != nil {
			t.Fatal(err)
		}
		paths = append(paths, s.Write(t, dir, "1.jpg", child))
	}
	existing := s.Write(t, output, "2.jpg", "keep")
	result := r.Execute(r.Request{Paths: paths, Pattern: "{番号}", Start: 1, OutputDir: output}, nil)
	if result.Issue == "" || s.Read(t, existing) != "keep" {
		t.Fatalf("%+v", result)
	}
	for index, path := range paths {
		if s.Read(t, path) != strconv.Itoa(index+1) {
			t.Fatalf("source changed: %s", path)
		}
	}
}
