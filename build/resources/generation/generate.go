package generation

import (
	"os"
	"path/filepath"

	"github.com/milkeclair/rename/build/resources/manifest"
	"github.com/milkeclair/rename/build/resources/product"
	"github.com/milkeclair/rename/build/resources/script"
)

func Generate(projectPath, templateDir, outputDir string) error {
	info, err := product.Read(projectPath)
	if err != nil {
		return err
	}

	appManifest, err := manifest.Load(filepath.Join(templateDir, "wails.exe.manifest"), info.Name, info.Info.ProductVersion)
	if err != nil {
		return err
	}

	rc, err := script.Render(filepath.Join(templateDir, "rename.rc"), info)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(outputDir, "rename.manifest"), appManifest, 0644); err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(outputDir, "rename.rc"), rc, 0644)
}
