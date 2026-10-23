package renamer

import "github.com/milkeclair/rename/backend/internal/fileops"

type Entry struct {
	Path      string `json:"path"`
	Name      string `json:"name"`
	Directory string `json:"directory"`
	CreatedAt int64  `json:"createdAt"`
}

func Inspect(paths []string) ([]Entry, error) {
	entries := []Entry{}
	seen := map[string]bool{}

	for _, path := range paths {
		files, err := fileops.InputFiles(path)
		if err != nil {
			return nil, err
		}

		for _, file := range files {
			entry, err := fileops.InspectFile(file)
			if err != nil {
				return nil, err
			}

			key := fileops.Key(entry.Path)

			if !seen[key] {
				entries = append(entries, Entry(entry))
				seen[key] = true
			}
		}
	}

	return entries, nil
}
