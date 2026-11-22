# Project maintenance instructions

Read `ROLE_FEATURES_ACCESS.md` before changing any role, navigation, feature, permission, scope, approval, report, login or sample-data workflow.

The user requires this file to remain the complete reference for every role. Update it in the **same change** whenever implementation changes. Keep implemented behavior separate from recommendations and unsupported features. Document:

- Entry points, views, read access and write actions for each affected role.
- School/section/grade/class/course/student/bus scope and active-role restrictions.
- Who requests, recommends, approves and executes a workflow.
- Browser persistence, report ownership, sample data and production limitations.
- Relevant demo accounts, validation evidence and the dated change log.

Check the other roles participating in a changed workflow and update their entries too. Keep `README.md` walkthrough links consistent. Verify scope and workflow changes with appropriate tests; include cross-school and cross-section rejection where applicable. Do not describe UI-only restrictions as server-enforced security.

Preserve the existing site's project identity and audience. Keep generated QA outputs and temporary credentials out of source control.
