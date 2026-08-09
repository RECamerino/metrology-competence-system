# Taxonomy

The complete Metrology Competence System taxonomy, as reviewable documents. Every domain, competency area and element, with the attainable level ceiling and the kind of competence each represents.

**Three ways to read it, for three different jobs:**

| | Best for |
|---|---|
| These Markdown files | Reading linearly, reviewing a pull request, diffing two versions, printing |
| [`taxonomy.csv`](taxonomy.csv) | Spreadsheet analysis, filtering, pivot tables, importing elsewhere |
| [Interactive viewer](https://recamerino.github.io/metrology-competence-system/) | Searching and filtering across all domains at once |

The authoritative source is [`content/taxonomy/domains/`](../../content/taxonomy/domains/). Everything here is generated from it and regenerated in CI, so it cannot drift.

---

## Totals

| | |
|---|---|
| Domains | 43 |
| Competency areas | 257 |
| Elements | 2232 |
| Assessable units | 9096 |

An assessable unit is one element at one level. Every level is assessed at element scope, so a credential names exactly what was tested.

## Level ceiling

The highest level attainable for an element. Not every element supports all five.

| Ceiling | Meaning | Elements | Share |
|---|---|---|---|
| 3 | Competent | 293 | 13.1% |
| 4 | Proficient | 1478 | 66.2% |
| 5 | Expert | 461 | 20.7% |

**L5 is reserved** for elements where a person could plausibly spend a career and still be learning, and where a defensible capstone with cross-organizational review is actually writable.

## Competence kind

What kind of competence an element is, and therefore what evidence proves it.

| Kind | The claim | What proves it | Elements | Share |
|---|---|---|---|---|
| Knowledge | I understand this | Explanation, relation, analysis | 658 | 29.5% |
| Skill | I can perform this | A witnessed work product | 1131 | 50.7% |
| Judgment | I can decide and defend it | A defence; often no single right answer | 443 | 19.8% |

**Authority is deliberately not a kind.** Knowledge, skill and judgment are earned and belong to a person. Authority is granted, and is a relationship between a person, an organization and a scope of work. Competency credentials are portable; authorizations are not. See [`../00-context.md`](../00-context.md).

## Cross-cutting core domains

Competencies every metrological role shares to some degree, including the adjacent ones that are routinely missed.

| Domain | Areas | Elements | K / S / J | L3 / L4 / L5 |
|---|---|---|---|---|
| [**CM-01** Foundations of Measurement Science](CM-01.md) | 6 | 46 | 43 / 0 / 3 | 31 / 14 / 1 |
| [**CM-02** Terminology and the International System of Units](CM-02.md) | 6 | 46 | 33 / 11 / 2 | 34 / 11 / 1 |
| [**CM-03** Measurement Uncertainty](CM-03.md) | 10 | 104 | 17 / 47 / 40 | 6 / 55 / 43 |
| [**CM-04** Traceability, Reference Standards and the CIPM MRA](CM-04.md) | 6 | 49 | 32 / 5 / 12 | 4 / 31 / 14 |
| [**CM-05** Statistics and Data Analysis for Metrology](CM-05.md) | 11 | 89 | 17 / 55 / 17 | 8 / 49 / 32 |
| [**CM-06** Calibration Methodology and Practice](CM-06.md) | 9 | 73 | 11 / 34 / 28 | 7 / 51 / 15 |
| [**CM-07** Measurement Systems Analysis and Process Capability](CM-07.md) | 7 | 56 | 13 / 25 / 18 | 3 / 42 / 11 |
| [**CM-08** Measurement Decision Risk, Guardbanding and Conformity Assessment](CM-08.md) | 6 | 46 | 18 / 11 / 17 | 1 / 31 / 14 |
| [**CM-09** Calibration Intervals and Measurement Reliability](CM-09.md) | 5 | 38 | 8 / 16 / 14 | 1 / 26 / 11 |
| [**CM-10** Quality Management Systems and Accreditation](CM-10.md) | 6 | 55 | 37 / 7 / 11 | 12 / 36 / 7 |
| [**CM-11** Assessment, Auditing and Approved Signatory Competence](CM-11.md) | 6 | 48 | 12 / 12 / 24 | 2 / 30 / 16 |
| [**CM-12** Laboratory Operations, Environment and Facilities](CM-12.md) | 5 | 41 | 4 / 26 / 11 | 13 / 24 / 4 |
| [**CM-13** Instrumentation and Physical Principles](CM-13.md) | 6 | 54 | 28 / 16 / 10 | 12 / 36 / 6 |
| [**CM-14** Software, Data and Digital Metrology](CM-14.md) | 6 | 53 | 14 / 25 / 14 | 20 / 27 / 6 |
| [**CM-15** Technical Communication and Documentation](CM-15.md) | 6 | 45 | 1 / 25 / 19 | 14 / 26 / 5 |
| [**CM-16** Data Presentation and Visualization](CM-16.md) | 5 | 37 | 10 / 16 / 11 | 17 / 16 / 4 |
| [**CM-17** Teaching, Training and Knowledge Transfer](CM-17.md) | 5 | 39 | 11 / 10 / 18 | 12 / 21 / 6 |
| [**CM-18** Project, Programme and Business Management](CM-18.md) | 6 | 46 | 5 / 13 / 28 | 15 / 26 / 5 |
| [**CM-19** Ethics, Legal and Regulatory Metrology](CM-19.md) | 6 | 48 | 35 / 1 / 12 | 21 / 24 / 3 |
| [**CM-20** Research, Development and Innovation in Metrology](CM-20.md) | 5 | 35 | 3 / 10 / 22 | 5 / 18 / 12 |
| [**CM-21** Artificial Intelligence and Machine Learning in Metrology](CM-21.md) | 7 | 59 | 14 / 18 / 27 | 7 / 33 / 19 |
| [**CM-22** Human Factors, Safety and Risk](CM-22.md) | 5 | 40 | 12 / 16 / 12 | 7 / 29 / 4 |

## Discipline packs

Measurement-discipline depth. Separately versioned; a role profile selects from these rather than assuming them entire.

| Domain | Areas | Elements | K / S / J | L3 / L4 / L5 |
|---|---|---|---|---|
| [**DP-01** Dimensional and Geometric Metrology](DP-01.md) | 8 | 94 | 24 / 61 / 9 | 5 / 70 / 19 |
| [**DP-02** Mass, Force, Torque and Hardness](DP-02.md) | 6 | 64 | 14 / 47 / 3 | 5 / 44 / 15 |
| [**DP-03** Pressure, Vacuum, Density and Viscosity](DP-03.md) | 6 | 57 | 15 / 42 / 0 | 4 / 46 / 7 |
| [**DP-04** Vibration, Shock and Acoustics](DP-04.md) | 5 | 48 | 11 / 36 / 1 | 2 / 38 / 8 |
| [**DP-05** Temperature and Thermophysical Properties](DP-05.md) | 5 | 54 | 11 / 41 / 2 | 1 / 45 / 8 |
| [**DP-06** Humidity and Moisture](DP-06.md) | 5 | 37 | 6 / 28 / 3 | 5 / 26 / 6 |
| [**DP-07** Flow Measurement](DP-07.md) | 5 | 48 | 24 / 17 / 7 | 2 / 39 / 7 |
| [**DP-08** DC and Low Frequency Electrical Metrology](DP-08.md) | 6 | 52 | 13 / 38 / 1 | 2 / 39 / 11 |
| [**DP-09** AC, Power, Energy and Impedance](DP-09.md) | 5 | 48 | 8 / 40 / 0 | 2 / 38 / 8 |
| [**DP-10** RF, Microwave, Antenna and EMC](DP-10.md) | 6 | 57 | 15 / 41 / 1 | 1 / 46 / 10 |
| [**DP-11** Magnetics and High Voltage](DP-11.md) | 5 | 41 | 9 / 29 / 3 | 2 / 32 / 7 |
| [**DP-12** Photometry, Radiometry and Colorimetry](DP-12.md) | 5 | 48 | 12 / 34 / 2 | 1 / 41 / 6 |
| [**DP-13** Spectroscopy, Lasers and Fibre Optics](DP-13.md) | 6 | 48 | 11 / 36 / 1 | 1 / 40 / 7 |
| [**DP-14** Time, Frequency and Satellite Timing](DP-14.md) | 6 | 48 | 18 / 25 / 5 | 3 / 35 / 10 |
| [**DP-15** Ionising Radiation, Dosimetry and Nuclear Instrumentation](DP-15.md) | 5 | 47 | 16 / 26 / 5 | 0 / 38 / 9 |
| [**DP-16** Analytical Chemistry, Reference Materials and Gas Metrology](DP-16.md) | 7 | 61 | 11 / 45 / 5 | 0 / 49 / 12 |
| [**DP-17** Biological, Clinical and Medical Metrology](DP-17.md) | 5 | 46 | 11 / 31 / 4 | 1 / 37 / 8 |
| [**DP-18** Nanometrology and Surface Science](DP-18.md) | 5 | 39 | 10 / 26 / 3 | 0 / 30 / 9 |
| [**DP-19** Additive Manufacturing and Advanced Production Metrology](DP-19.md) | 5 | 54 | 6 / 40 / 8 | 1 / 40 / 13 |
| [**DP-20** Digital Metrology, DCC and Industry 4.0](DP-20.md) | 5 | 39 | 14 / 19 / 6 | 1 / 30 / 8 |
| [**DP-21** Geodetic and Gravitational Metrology](DP-21.md) | 6 | 55 | 21 / 30 / 4 | 2 / 19 / 34 |

---

## Reading an element ID

`CM-03-014` — domain `CM-03`, element 014.

**The prefix records where the element was first created and is historical.** The authoritative domain and competency area are fields on the element, so an element can be reorganised without renaming an ID. IDs are append-only and never change: a credential attesting `CM-03-014` must resolve to the same element permanently, or the person holding it loses their evidence.

*Generated by `npm run build:docs`. Do not edit these files — edit the YAML in `content/taxonomy/domains/`.*
