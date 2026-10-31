#!/bin/zsh
# usage: recalc.sh in.xlsx out.xlsx
osascript - "$1" "$2" <<'AS'
on run argv
tell application "Microsoft Excel"
	set display alerts to false
	open POSIX file (item 1 of argv)
	calculate full
	save workbook as active workbook filename (item 2 of argv) file format Excel XML file format with overwrite
	close active workbook saving no
	set display alerts to true
end tell
end run
AS
