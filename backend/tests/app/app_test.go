//go:build windows

package app_test

import (
	"context"
	"errors"
	a "github.com/milkeclair/rename/backend/app"
	r "github.com/milkeclair/rename/backend/internal/renamer"
	s "github.com/milkeclair/rename/backend/tests/support"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"path/filepath"
	"testing"
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
func TestStartupAndChooseOutput(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	want := errors.New("dialog error")
	host := a.Host{OpenDirectoryDialog: func(actual context.Context, options runtime.OpenDialogOptions) (string, error) {
		if actual != ctx || options.Title != "出力先フォルダを選択" {
			t.Fatal("context/options not passed")
		}
		return "D:/out", want
	}}
	host.Run = func(options *options.App) error {
		options.OnStartup(ctx)
		app, ok := options.Bind[0].(*a.App)
		if !ok {
			t.Fatal("wrong binding")
		}
		got, err := app.ChooseOutput()
		if got != "D:/out" || err != want {
			t.Fatalf("%s %v", got, err)
		}
		return nil
	}
	a.Run(nil, host)
}
func TestExecuteLockProgressAndBeforeClose(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	request := r.Request{Paths: []string{source}, Pattern: "{番号}", Start: 1, OutputDir: dir}
	calls := 0
	host := a.Host{}
	host.Run = func(options *options.App) error {
		options.OnStartup(ctx)
		app, ok := options.Bind[0].(*a.App)
		if !ok {
			t.Fatal("wrong binding")
		}
		if options.OnBeforeClose(ctx) {
			t.Fatal("idle window blocked")
		}
		result, err := app.Execute(request)
		if err != nil || result.Items[0].Status != r.StatusDone {
			t.Fatalf("%+v %v", result, err)
		}
		if options.OnBeforeClose(ctx) {
			t.Fatal("lock not released")
		}
		return nil
	}
	host.EventsEmit = func(actual context.Context, name string, values ...interface{}) {
		calls++
		if actual != ctx || name != "rename:progress" || len(values) != 1 {
			t.Fatal("invalid event")
		}
		progress, ok := values[0].(r.Progress)
		if !ok || progress.Completed != 1 || progress.Total != 1 {
			t.Fatalf("%v", values)
		}
	}
	a.Run(nil, host)
	if calls != 1 {
		t.Fatalf("progress calls %d", calls)
	}
}
func TestExecuteRejectsReentry(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	source := s.Write(t, dir, "a", "a")
	request := r.Request{Paths: []string{source}, Pattern: "{番号}", Start: 1, OutputDir: dir}
	var bound *a.App
	var beforeClose func(context.Context) bool
	host := a.Host{EventsEmit: func(context.Context, string, ...interface{}) {
		if !beforeClose(ctx) {
			t.Fatal("active window can close")
		}
		if _, err := bound.Execute(request); err == nil {
			t.Fatal("reentry allowed")
		}
	}}
	host.Run = func(options *options.App) error {
		options.OnStartup(ctx)
		var ok bool
		bound, ok = options.Bind[0].(*a.App)
		if !ok {
			t.Fatal("wrong binding")
		}
		beforeClose = options.OnBeforeClose
		_, err := bound.Execute(request)
		return err
	}
	a.Run(nil, host)
}
