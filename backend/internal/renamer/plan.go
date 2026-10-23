package renamer

import (
	"path/filepath"
	"slices"

	"github.com/milkeclair/rename/backend/internal/fileops"
)

type Request struct {
	Paths     []string `json:"paths"`
	Pattern   string   `json:"pattern"`
	Start     int64    `json:"start"`
	OutputDir string   `json:"outputDir"`
}

type Item struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Name        string `json:"name"`
	Issue       string `json:"issue"`
}

type Plan struct {
	Items []Item `json:"items"`
	Issue string `json:"issue"`
}

type SourceInfo struct {
	Path string
	Err  error
}

func PlanItems(request Request, inputs []SourceInfo, output string) []Item {
	pattern, patternErr := ParsePattern(request.Pattern)
	items := make([]Item, 0, len(inputs))
	sources := map[string]bool{}

	for index, input := range inputs {
		item := Item{Source: input.Path}

		if input.Err != nil {
			item.Issue = input.Err.Error()
		}
		if sources[fileops.Key(input.Path)] {
			item.Issue = "同じファイルが複数回指定されています"
		}

		if patternErr != nil {
			item.Issue = patternErr.Error()
		} else {
			name, err := pattern.Format(request.Start+int64(index), filepath.Ext(input.Path))
			item.Name = name
			if err != nil {
				item.Issue = err.Error()
			}
		}

		if output != "" {
			item.Destination = filepath.Join(output, item.Name)
		}

		sources[fileops.Key(input.Path)] = true
		items = append(items, item)
	}

	return items
}

func ValidateDestinations(plan Plan, states map[string]fileops.Destination) Plan {
	result := Plan{Items: slices.Clone(plan.Items), Issue: plan.Issue}
	sources := map[string]bool{}
	destinations := map[string]int{}

	for _, item := range result.Items {
		sources[fileops.Key(item.Source)] = true
	}

	for index := range result.Items {
		item := &result.Items[index]

		if item.Issue != "" || item.Destination == "" {
			continue
		}

		key := fileops.Key(item.Destination)
		if previous, exists := destinations[key]; exists {
			item.Issue = "変更後の名前が重複しています"
			result.Items[previous].Issue = item.Issue
		}
		destinations[key] = index

		state := states[key]
		if state.Err != nil {
			item.Issue = "出力先を確認できません: " + state.Err.Error()
		} else if state.Exists && !sources[key] {
			item.Issue = "出力先に対象外のファイルまたはフォルダが存在します"
		}
	}

	return result
}
