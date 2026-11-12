//go:build windows

package app_test

import (
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"

	a "github.com/milkeclair/rename/backend/app"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func TestRun(t *testing.T) {
	assets := fstest.MapFS{"index.html": {Data: []byte("app")}}
	calls := 0
	a.Run(assets, a.Host{Run: func(options application.Options, window application.WebviewWindowOptions, beforeClose func() bool) error {
		calls++
		if options.Name != "rename" || window.Title != "rename" || window.Width != 1100 || window.Height != 800 || window.MinWidth != 800 || window.MinHeight != 650 {
			t.Fatalf("wrong window options: %+v", window)
		}
		if options.Assets.Handler == nil || !window.EnableFileDrop || !window.Windows.DisableIcon {
			t.Fatal("asset/drop/icon options missing")
		}
		response := httptest.NewRecorder()
		options.Assets.Handler.ServeHTTP(response, httptest.NewRequest("GET", "/", nil))
		if response.Code != 200 || !strings.Contains(response.Body.String(), "app") {
			t.Fatalf("assets unavailable: %d %s", response.Code, response.Body.String())
		}
		if beforeClose == nil || options.ShouldQuit == nil || len(options.Services) != 1 {
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
	a.Run(fstest.MapFS{"index.html": {Data: []byte("app")}}, a.Host{
		Run: func(application.Options, application.WebviewWindowOptions, func() bool) error { return want },
		Fatal: func(values ...interface{}) {
			calls++
			if len(values) != 1 || values[0] != want {
				t.Fatalf("%v", values)
			}
		},
	})
	if calls != 1 {
		t.Fatal("startup error lost")
	}
}
