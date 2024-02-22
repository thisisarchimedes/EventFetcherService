# Tests - Interface

[X] Load json from AWS bucket
[X] Load current PSP addresses from AWS bucket
[X] Fetch logs
[X] fetch logs from a specific block and contract
[X] Detect PSP deposit event
[X] Detect PSP withdraw event
[] Detect PSP adjust in event
[] Detect PSP adjust out event
[] Detect PSP do hard work event

# Tests - Unit

[] Unit tests factory psp
[] Unit tests factory leverage
[] acceptance test psp
[] acceptance test leverage

# Refactor

[] Improve Factory - for leverage check the correct address on each If condition
[] Generalize EventFetcherLogEntryMessage different message for each even
[] Liquidate position get user address from tx hash
[] Use the correct terminology (Port is the interface ; Adapter is the impementation of this interface)


# Notes

[] Fix commit.yml and which env variables are needed and use in the script and secrets


--
