package renamer

import "github.com/milkeclair/rename/backend/internal/fileops"

func Preview(request Request) Plan {
	if err := ValidateNumberRange(request.Start, len(request.Paths)); err != nil {
		return Plan{Items: []Item{}, Issue: err.Error()}
	}

	output, err := fileops.OutputDirectory(request.OutputDir)
	plan := Plan{}
	if err != nil {
		plan.Issue = err.Error()
	}

	inputs := make([]SourceInfo, 0, len(request.Paths))
	for _, path := range request.Paths {
		source, err := fileops.SourcePath(path)
		inputs = append(inputs, SourceInfo{Path: source, Err: err})
	}
	plan.Items = PlanItems(request, inputs, output)

	destinations := map[string]fileops.Destination{}
	for _, item := range plan.Items {
		if item.Issue == "" && item.Destination != "" {
			destinations[fileops.Key(item.Destination)] = fileops.ReadDestination(item.Destination)
		}
	}

	return ValidateDestinations(plan, destinations)
}
