package generation

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/milkeclair/rename/build/resources/manifest"
	"github.com/milkeclair/rename/build/resources/product"
	"github.com/milkeclair/rename/build/resources/script"
)

func Generate(projectPath, templateDir, outputDir, version string) error {
	info, err := product.Read(projectPath)
	if err != nil {
		return err
	}

	if version != "" {
		info.Info.ProductVersion = version
	}
	parts := strings.Split(info.Info.ProductVersion, ".")
	if len(parts) != 3 {
		return fmt.Errorf("invalid Windows product version %q", info.Info.ProductVersion)
	}
	for _, part := range parts {
		if _, err := strconv.ParseUint(part, 10, 16); err != nil || len(part) > 1 && part[0] == '0' {
			return fmt.Errorf("invalid Windows product version %q", info.Info.ProductVersion)
		}
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
