package app

import (
	"context"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
)

type Host struct {
	Run                 func(*options.App) error
	OpenDirectoryDialog func(context.Context, runtime.OpenDialogOptions) (string, error)
	EventsEmit          func(context.Context, string, ...interface{})
	Fatal               func(...interface{})
}

func NativeHost() Host {
	return Host{Run: wails.Run, OpenDirectoryDialog: runtime.OpenDirectoryDialog, EventsEmit: runtime.EventsEmit, Fatal: log.Fatal}
}
