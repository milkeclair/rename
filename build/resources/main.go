package main

import (
	"log"

	"github.com/milkeclair/rename/build/resources/generation"
)

func main() {
	if err := generation.Generate("wails.json", "build/windows", "build/generated"); err != nil {
		log.Fatal(err)
	}
}
