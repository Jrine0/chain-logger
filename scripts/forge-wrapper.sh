#!/usr/bin/env bash
# Wrapper to run Foundry (forge, cast, anvil) from Windows via WSL
export PATH="$HOME/.foundry/bin:$PATH"
exec "$@"
