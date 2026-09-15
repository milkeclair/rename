package app

import (
	"io/fs"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

func Run(assets fs.FS, host Host) {
	app := NewApp(host)

	err := host.Run(&options.App{
		Title:            "rename",
		Width:            1100,
		Height:           800,
		MinWidth:         800,
		MinHeight:        650,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 246, G: 248, B: 251, A: 255},
		DragAndDrop:      &options.DragAndDrop{EnableFileDrop: true},
		OnStartup:        app.startup,
		OnBeforeClose:    app.beforeClose,
		Bind:             []interface{}{app},
		Windows:          &windows.Options{DisableWindowIcon: true},
	})
	if err != nil {
		host.Fatal(err)
	}
}
