package app

import (
	"log"

	"github.com/milkeclair/rename/backend/internal/renamer"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

type Host struct {
	Run                 func(application.Options, application.WebviewWindowOptions, func() bool) error
	OpenDirectoryDialog func(application.OpenFileDialogOptions) (string, error)
	EventsEmit          func(string, renamer.Progress)
	Fatal               func(...interface{})
}

func NativeHost() Host {
	var native *application.App
	return Host{
		Run: func(options application.Options, windowOptions application.WebviewWindowOptions, beforeClose func() bool) error {
			native = application.New(options)
			window := native.Window.NewWithOptions(windowOptions)
			window.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
				if beforeClose() {
					event.Cancel()
				}
			})
			window.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
				native.Event.Emit("rename:files-dropped", event.Context().DroppedFiles())
			})
			return native.Run()
		},
		OpenDirectoryDialog: func(options application.OpenFileDialogOptions) (string, error) {
			return native.Dialog.OpenFileWithOptions(&options).PromptForSingleSelection()
		},
		EventsEmit: func(name string, progress renamer.Progress) { native.Event.Emit(name, progress) },
		Fatal:      log.Fatal,
	}
}
