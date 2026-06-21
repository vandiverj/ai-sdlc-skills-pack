# Cycle 5a Downstream Scout Evidence

Date: 2026-06-20
Status: Downstream LM Studio scout test completed; source-pointer quality needs tightening

## Scope

Repository:

```text
/Users/jerrickvandiver/work/www_dev
```

Task:

```text
Downstream Cycle 5a scout test on admin company employee search
```

Scoped files:

```text
adminCompEmpSearch/status_and_results_func.asp
adminCompEmpSearch/adminCompEmpSearchInitialForm.html
adminCompEmpSearch/admin_companyemp_search.js
```

Task type: `duplication-scan`

## Runtime

The hosted parent session still cannot spawn `sdlc_lmstudio_read_only_code_scout`. The downstream test used Codex CLI against the local LM Studio Responses endpoint:

```text
codex exec -m google/gemma-4-26b-a4b-qat -C /Users/jerrickvandiver/work/www_dev --sandbox read-only --skip-git-repo-check -c model_provider="lmstudio-local" -c model_providers.lmstudio-local={name="LM Studio Local", base_url="http://127.0.0.1:1234/v1", wire_api="responses"}
```

The previously proven `google/gemma-4-26b-a4b-qat:2` model id was not listed by the local LM Studio endpoint during this run. The loaded model id was `google/gemma-4-26b-a4b-qat`.

## Artifacts

```text
/private/tmp/cycle5a-wwwdev-admin-comp-emp-scout-packet.md
/private/tmp/cycle5a-wwwdev-lmstudio-scout-raw.txt
```

## Result

`sdlc agents scout-validate --repo /Users/jerrickvandiver/work/www_dev --packet /private/tmp/cycle5a-wwwdev-lmstudio-scout-raw.txt` passed.

The scout returned one low-severity duplication finding. Orchestrator source verification found the broad observation plausible because `GetTfsspCartStatus` and `GetDasspCartStatus` share query/setup/result-shaping structure. However, the returned finding cited weak or wrong line pointers:

```text
adminCompEmpSearch/status_and_results_func.asp:13
adminCompEmpSearch/status_and_results_func.asp:56
```

Line 13 is inside `CheckTransferBlock`, not the cart-status functions. Line 56 is inside the TFSSP `case` block, not the paired DASSP function. Better pointers would cite the function starts and specific comparable blocks, such as:

```text
adminCompEmpSearch/status_and_results_func.asp:18-99
adminCompEmpSearch/status_and_results_func.asp:101-127
```

## Decision

Accept the packet as valid contract evidence.

Reject the finding as directly actionable because source-pointer precision was not good enough for implementation.

Keep local-model downstream scouting at `Experiment`. The run proves that LM Studio can return schema-valid downstream packets through Codex CLI, but it does not yet prove reliable usefulness or cost savings.

## Follow-Up

- Tighten the scout role, packet guidance, and validator so finding-level pointers must be exact line or range pointers.
- Repeat a smaller downstream scout task after tightening.
- Compare against hosted `sdlc_read_only_code_scout` when the current Codex surface can spawn it.

## Follow-Up Results

After tightening the source-pointer contract, the user-level Codex adapters were refreshed from `templates/adapters/codex/*.toml`.

Hosted custom scout comparison:

```text
/private/tmp/cycle5a-wwwdev-hosted-comparison-scout-packet.md
/private/tmp/cycle5a-wwwdev-hosted-scout-findings.json
```

The hosted `sdlc_read_only_code_scout` completed and returned a no-finding packet. Validation passed. The packet used line-range reviewed pointers:

```text
/Users/jerrickvandiver/work/www_dev/adminCompEmpSearch/status_and_results_func.asp:1-868
/Users/jerrickvandiver/work/www_dev/adminCompEmpSearch/adminCompEmpSearchInitialForm.html:1-174
/Users/jerrickvandiver/work/www_dev/adminCompEmpSearch/admin_companyemp_search.js:1-16
```

The hosted scout did not produce an actionable finding, but it followed the tightened no-finding pointer contract better than the first LM Studio run.

Smaller LM Studio post-tightening test:

```text
/private/tmp/cycle5a-wwwdev-small-tightened-scout-packet.md
/private/tmp/cycle5a-wwwdev-small-tightened-lmstudio-raw.txt
```

Scope:

```text
adminCompEmpSearch/adminCompEmpSearchInitialForm.html
adminCompEmpSearch/admin_companyemp_search.js
```

Result:

```text
sdlc agents scout-validate --repo /Users/jerrickvandiver/work/www_dev --packet /private/tmp/cycle5a-wwwdev-small-tightened-lmstudio-raw.txt
```

failed because each finding used `issue` and `details` instead of the required `summary` field.

The smaller LM Studio run did improve from file-level pointers to line-qualified pointers, but source verification still found pointer precision issues:

```text
Session assignment was reported at adminCompEmpSearch/adminCompEmpSearchInitialForm.html:6, but the assignment is line 5.
SQL construction was reported at adminCompEmpSearch/adminCompEmpSearchInitialForm.html:43, but the construction is line 41.
```

Current comparison:

```text
LM Studio first downstream run: valid packet, plausible finding, weak/wrong line pointers.
Hosted custom scout comparison: valid no-finding packet, better reviewed-range pointers, no actionable finding.
LM Studio smaller tightened run: invalid packet due to finding field names, better but still imprecise line pointers.
```

Cycle 5a conclusion remains unchanged: local-model downstream scouts are useful enough for controlled experiments but not reliable enough for unattended findings. Hosted custom scouts currently have better contract adherence for no-finding packets.
