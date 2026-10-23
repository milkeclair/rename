package main

import (
	"embed"

	"github.com/milkeclair/rename/backend/app"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app.Run(assets, app.NativeHost())
}
