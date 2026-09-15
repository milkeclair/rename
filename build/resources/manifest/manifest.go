package manifest

import (
	"bytes"
	"encoding/xml"
	"os"
	"text/template"
)

func Load(path, name, version string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	source, err := template.New("manifest").Parse(string(data))
	if err != nil {
		return nil, err
	}

	project := struct {
		Name string
		Info struct{ ProductVersion string }
	}{Name: name}
	project.Info.ProductVersion = version

	var output bytes.Buffer
	if err := source.Execute(&output, project); err != nil {
		return nil, err
	}

	var document struct{}
	if err := xml.Unmarshal(output.Bytes(), &document); err != nil {
		return nil, err
	}

	return output.Bytes(), nil
}
