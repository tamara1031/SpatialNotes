package service

import "errors"

var (
	ErrNodeNotFound = errors.New("node not found")
	ErrCircularRef  = errors.New("circular reference detected")
)
