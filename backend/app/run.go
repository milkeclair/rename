package app

import (
	"io/fs"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func Run(assets fs.FS, host Host) {
	app := NewApp(host)
	err := host.Run(application.Options{
		Name:       "rename",
		Services:   []application.Service{application.NewService(app)},
		Assets:     application.AssetOptions{Handler: application.AssetFileServerFS(assets)},
		ShouldQuit: func() bool { return !app.beforeClose() },
	}, application.WebviewWindowOptions{
		Title:            "rename",
		Width:            1100,
		Height:           800,
		MinWidth:         800,
		MinHeight:        650,
		BackgroundColour: application.RGBA{Red: 246, Green: 248, Blue: 251, Alpha: 255},
		EnableFileDrop:   true,
		Windows:          application.WindowsWindow{DisableIcon: true},
	}, app.beforeClose)
	if err != nil {
		host.Fatal(err)
	}
}
