package main

import (
	"flag"
	"log"

	"github.com/milkeclair/rename/build/resources/generation"
)

func main() {
	version := flag.String("version", "", "Windows product version (X.Y.Z)")
	flag.Parse()
	if err := generation.Generate("wails.json", "build/windows", "build/generated", *version); err != nil {
		log.Fatal(err)
	}
}
