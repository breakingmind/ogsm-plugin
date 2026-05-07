# Review Rubric

Score each dimension from 1 to 5.

1 means weak, unclear, or missing.
3 means usable but needs correction.
5 means clear, focused, and operational.

## Dimensions

- Objective clarity
- Goal measurability
- Strategy as resource/method quality
- MD quality
- MP executability
- MP-to-MD linkage
- MD-to-Strategy linkage
- Strategy-to-Goal linkage
- Goal-to-Objective linkage
- Backward logic: MP to MD to S to G to O
- Plan alignment
- Schedule alignment
- Time allocation realism
- Execution risk

Every score below 4 needs a reason and a concrete correction.

## Confidence

Use high confidence only when the OGSM profile and input are both clear.
Use medium confidence when assumptions are minor.
Use low confidence when profile, plan, or schedule data is incomplete.

## Script-Driven Layer Scoring

O/G/S/MD/MP layer scores (1–5) are driven by `validate-profile-logic.js` output.

- Structural gaps (missing numbers, dates, owners, keywords) are detected automatically by the script.
- Semantic gaps (O5 vivid picture, O6 keyword identification, S17–S19 resource uniqueness) require AI judgement.
- Each gap is tagged with its audit question number (O1–B30) from `ogsm-profile-audit-questions.md`.
- Use these question numbers as the traceability reference when reporting rubric findings.
