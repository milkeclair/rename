//go:build windows

package app_test

import (
	"errors"
	a "github.com/milkeclair/rename/backend/app"
	"github.com/wailsapp/wails/v2/pkg/options"
	"testing"
	"testing/fstest"
)

func TestRun(t *testing.T) {
	assets := fstest.MapFS{"index.html": {Data: []byte("app")}}
	calls := 0
	a.Run(assets, a.Host{Run: func(options *options.App) error {
		calls++
		if options.Title != "rename" || options.Width != 1100 || options.Height != 800 || options.MinWidth != 800 || options.MinHeight != 650 {
			t.Fatalf("wrong window options: %+v", options)
		}
		if options.AssetServer.Assets == nil || !options.DragAndDrop.EnableFileDrop || !options.Windows.DisableWindowIcon {
			t.Fatal("asset/drop/icon options missing")
		}
		file, err := options.AssetServer.Assets.Open("index.html")
		if err != nil {
			t.Fatal(err)
		}
		file.Close()
		if options.OnStartup == nil || options.OnBeforeClose == nil || len(options.Bind) != 1 {
			t.Fatal("lifecycle missing")
		}
		return nil
	}, Fatal: func(...interface{}) { t.Fatal("unexpected failure") }})
	if calls != 1 {
		t.Fatalf("launch calls=%d", calls)
	}
}
func TestRunFailure(t *testing.T) {
	want := errors.New("startup failure")
	calls := 0
	a.Run(nil, a.Host{Run: func(*options.App) error { return want }, Fatal: func(values ...interface{}) {
		calls++
		if len(values) != 1 || values[0] != want {
			t.Fatalf("%v", values)
		}
	}})
	if calls != 1 {
		t.Fatal("startup error lost")
	}
}
