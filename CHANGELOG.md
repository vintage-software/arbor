#0.4.0
###Features
- live log disabled by default, enabled with --live-log option
- add --cwd option to change current working directory
- show latest output/progress from running processes
- replace backspaces in log with newlines

#0.3.1
###Bug Fixes
- minor fix for LF line ending support on unix

#0.3.0
###Features
- live log for running processes

#0.2.2
###Bug Fixes
- report non-zero exit codes as errors

#0.2.1
###Bug Fixes
- fix task failure due to buffer overflow
- write more error info to log

#0.2.0
###Bug Fixes
- exit with code 1 when exiting after task failure

#0.1.10
###Features
- new `arbor init` to create a simple project `arbor.json` config

#0.0.10
###Performance
- Start task as soon as all dependencies succeed.
- Don't start task if dependency failed for faster exits

###Features
- Improved logging overall

#0.0.9
###Features
- Check for updates on start (simple compare)

#0.0.7
###Bug Fixes
- Republish for cmd binding bug

#0.0.5
###Features
- Ability to build projects based on dependency graph

#0.0.4
###Features
- Ability to rerun failed tasks
- Error logs
- Allow multiple projects per a config
- Multiple Commands per task
