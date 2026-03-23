package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type Symbol struct {
	Type string `json:"type"`
	Name string `json:"name"`
	Line int    `json:"line"`
}

var (
	tsPatterns = []struct {
		Type string
		Re   *regexp.Regexp
	}{
		{"class", regexp.MustCompile(`(?m)^export\s+(?:abstract\s+)?class\s+(\w+)`)},
		{"function", regexp.MustCompile(`(?m)^export\s+function\s+(\w+)`)},
		{"method", regexp.MustCompile(`(?m)^\s+(?:public\s+|private\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]`)},
		{"interface", regexp.MustCompile(`(?m)^export\s+interface\s+(\w+)`)},
	}
	goPatterns = []struct {
		Type string
		Re   *regexp.Regexp
	}{
		{"struct", regexp.MustCompile(`(?m)^type\s+(\w+)\s+struct`)},
		{"interface", regexp.MustCompile(`(?m)^type\s+(\w+)\s+interface`)},
		{"func", regexp.MustCompile(`(?m)^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(`)},
	}
)

func getSymbols(filePath string) ([]Symbol, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(content), "\n")
	var symbols []Symbol
	ext := filepath.Ext(filePath)

	if ext == ".ts" || ext == ".tsx" {
		for i, line := range lines {
			for _, p := range tsPatterns {
				matches := p.Re.FindStringSubmatch(line)
				if len(matches) > 1 {
					symbols = append(symbols, Symbol{p.Type, matches[1], i + 1})
				}
			}
		}
	} else if ext == ".go" {
		for i, line := range lines {
			for _, p := range goPatterns {
				matches := p.Re.FindStringSubmatch(line)
				if len(matches) > 1 {
					symbols = append(symbols, Symbol{p.Type, matches[1], i + 1})
				}
			}
		}
	}

	return symbols, nil
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: tagger <file-path>")
		os.Exit(1)
	}

	symbols, err := getSymbols(os.Args[1])
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	out, _ := json.MarshalIndent(symbols, "", "  ")
	fmt.Println(string(out))
}
