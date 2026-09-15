package product

import (
	"encoding/json"
	"os"
)

type Info struct {
	Name string
	Info struct {
		CompanyName    string
		ProductName    string
		ProductVersion string
		Comments       string
	}
}

func Read(path string) (Info, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Info{}, err
	}

	var product Info
	err = json.Unmarshal(data, &product)

	return product, err
}
