//go:build windows

package app_test

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"testing/fstest"

	a "github.com/milkeclair/rename/backend/app"
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func TestNewAppInspectAndPreview(t *testing.T) {
	app := a.NewApp(a.Host{})
	dir := t.TempDir()
	source := s.Write(t, dir, "a.txt", "a")
	entries, err := app.Inspect([]string{source})
	if err != nil || len(entries) != 1 || entries[0].Path != source {
		t.Fatalf("%+v %v", entries, err)
	}
	plan := app.Preview(r.Request{Paths: []string{source}, Pattern: "{番号}", Start: 1, OutputDir: dir})
	if plan.Issue != "" || plan.Items[0].Destination != filepath.Join(dir, "1.txt") {
		t.Fatalf("%+v", plan)
	}
}

func TestChooseParent(t *testing.T) {
	want := errors.New("dialog error")
	app := a.NewApp(a.Host{OpenDirectoryDialog: func(options application.OpenFileDialogOptions) (string, error) {
		if options.Title != "取り込む子フォルダの親フォルダを選択" || !options.CanChooseDirectories || options.CanChooseFiles {
			t.Fatalf("wrong options: %+v", options)
		}
		return "C:/parent", want
	}})
	got, err := app.ChooseParent()
	if got != "C:/parent" || err != want {
		t.Fatalf("%s %v", got, err)
	}
}

func TestAppInspectChildren(t *testing.T) {
	parent := t.TempDir()
	child := filepath.Join(parent, "1")
	if err := os.Mkdir(child, 0700); err != nil {
		t.Fatal(err)
	}
	path := s.Write(t, child, "1.jpg", "first")
	app := a.NewApp(a.Host{})
	entries, err := app.InspectChildren(parent)
	if err != nil || len(entries) != 1 || entries[0].Path != path {
		t.Fatalf("%+v %v", entries, err)
	}
	if _, err := app.InspectChildren(filepath.Join(parent, "missing")); err == nil {
		t.Fatal("missing parent accepted")
	}
}

func TestChooseOutput(t *testing.T) {
	want := errors.New("dialog error")
	app := a.NewApp(a.Host{OpenDirectoryDialog: func(options application.OpenFileDialogOptions) (string, error) {
		if options.Title != "出力先フォルダを選択" || !options.CanChooseDirectories || options.CanChooseFiles {
			t.Fatalf("wrong options: %+v", options)
		}
		return "D:/out", want
	}})
	got, err := app.ChooseOutput()
	if got != "D:/out" || err != want {
		t.Fatalf("%s %v", got, err)
	}
}

func TestExecuteLockProgressAndBeforeClose(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	request := r.Request{Paths: []string{source}, Pattern: "{番号}", Start: 1, OutputDir: dir}
	calls := 0
	host := a.Host{EventsEmit: func(name string, progress r.Progress) {
		calls++
		if name != "rename:progress" || progress.Completed != 1 || progress.Total != 1 {
			t.Fatalf("%s %+v", name, progress)
		}
	}}
	host.Run = func(options application.Options, _ application.WebviewWindowOptions, beforeClose func() bool) error {
		app, ok := options.Services[0].Instance().(*a.App)
		if !ok {
			t.Fatal("wrong service")
		}
		if beforeClose() || !options.ShouldQuit() {
			t.Fatal("idle window blocked")
		}
		result, err := app.Execute(request)
		if err != nil || result.Items[0].Status != r.StatusDone {
			t.Fatalf("%+v %v", result, err)
		}
		if beforeClose() || !options.ShouldQuit() {
			t.Fatal("lock not released")
		}
		return nil
	}
	a.Run(fstest.MapFS{"index.html": {Data: []byte("app")}}, host)
	if calls != 1 {
		t.Fatalf("progress calls %d", calls)
	}
}

func TestExecuteRejectsReentry(t *testing.T) {
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	request := r.Request{Paths: []string{source}, Pattern: "{番号}", Start: 1, OutputDir: dir}
	var bound *a.App
	var beforeClose func() bool
	var shouldQuit func() bool
	host := a.Host{EventsEmit: func(string, r.Progress) {
		if !beforeClose() || shouldQuit() {
			t.Fatal("active window can close")
		}
		if _, err := bound.Execute(request); err == nil {
			t.Fatal("reentry allowed")
		}
	}}
	host.Run = func(options application.Options, _ application.WebviewWindowOptions, closing func() bool) error {
		var ok bool
		bound, ok = options.Services[0].Instance().(*a.App)
		if !ok {
			t.Fatal("wrong service")
		}
		beforeClose = closing
		shouldQuit = options.ShouldQuit
		_, err := bound.Execute(request)
		return err
	}
	a.Run(fstest.MapFS{"index.html": {Data: []byte("app")}}, host)
}
