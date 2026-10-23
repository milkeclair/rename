package script

import (
	"bytes"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/milkeclair/rename/build/resources/product"
)

func Render(path string, info product.Info) ([]byte, error) {
	functions := template.FuncMap{
		"quote": quote,
		"version": func(value string) string {
			return strings.ReplaceAll(value, ".", ",") + ",0"
		},
	}
	source, err := template.New("resource").Funcs(functions).ParseFiles(path)
	if err != nil {
		return nil, err
	}

	var output bytes.Buffer
	err = source.ExecuteTemplate(&output, filepath.Base(path), info)

	return output.Bytes(), err
}

func quote(value string) string {
	escaped := strings.NewReplacer("\\", "\\\\", "\"", "\\\"", "\r", "\\r", "\n", "\\n", "\t", "\\t").Replace(value)

	return "\"" + escaped + "\""
}
