package renamer_test

import (
	"errors"
	f "github.com/milkeclair/rename/backend/internal/fileops"
	r "github.com/milkeclair/rename/backend/internal/renamer"
	"path/filepath"
	"reflect"
	"testing"
)

func TestPlanItems(t *testing.T) {
	inputs := []r.SourceInfo{{Path: "a.txt"}, {Path: "b.png"}}
	request := r.Request{Pattern: "{番号:0000}", Start: 7}
	got := r.PlanItems(request, inputs, "out")
	want := []r.Item{{Source: "a.txt", Name: "0007.txt", Destination: filepath.Join("out", "0007.txt")}, {Source: "b.png", Name: "0008.png", Destination: filepath.Join("out", "0008.png")}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("%+v", got)
	}
	if inputs[0].Path != "a.txt" {
		t.Fatal("input changed")
	}
}
func TestPlanItemsInvalidSourcesAndPattern(t *testing.T) {
	request := r.Request{Pattern: "{番号}", Start: 1}
	got := r.PlanItems(request, []r.SourceInfo{{Path: "a", Err: errors.New("missing")}, {Path: "A"}}, "")
	if got[0].Issue != "missing" || got[1].Issue == "" || got[0].Destination != "" {
		t.Fatalf("%+v", got)
	}
	request.Pattern = "invalid"
	if r.PlanItems(request, []r.SourceInfo{{Path: "a"}}, "out")[0].Issue == "" {
		t.Fatal("bad pattern accepted")
	}
}
func TestValidateDestinations(t *testing.T) {
	plan := r.Plan{Items: []r.Item{{Source: "a", Destination: "b"}, {Source: "b", Destination: "a"}}}
	facts := map[string]f.Destination{"a": {Exists: true}, "b": {Exists: true}}
	got := r.ValidateDestinations(plan, facts)
	if got.Items[0].Issue != "" || got.Items[1].Issue != "" {
		t.Fatalf("swap rejected: %+v", got)
	}
	plan.Items[1].Destination = "B"
	got = r.ValidateDestinations(plan, facts)
	if got.Items[0].Issue == "" || got.Items[1].Issue == "" {
		t.Fatal("duplicate missed")
	}
	if plan.Items[0].Issue != "" {
		t.Fatal("original plan mutated")
	}
}
func TestValidateDestinationsConflictAndReadError(t *testing.T) {
	for _, fact := range []f.Destination{{Exists: true}, {Err: errors.New("denied")}} {
		plan := r.Plan{Items: []r.Item{{Source: "a", Destination: "out"}}}
		if r.ValidateDestinations(plan, map[string]f.Destination{"out": fact}).Items[0].Issue == "" {
			t.Fatal("conflict missed")
		}
	}
	plan := r.Plan{Items: []r.Item{{Source: "a", Destination: "out", Issue: "original"}, {Source: "b"}}}
	got := r.ValidateDestinations(plan, nil)
	if !reflect.DeepEqual(plan, got) {
		t.Fatal("invalid/incomplete item changed")
	}
}
