#!/usr/bin/env node
import { runCli } from "@almeidx/version-check/cli";

process.exitCode = await runCli();
