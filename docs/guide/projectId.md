1. Refer the WI W-23636419 for the requirement, acceptance criteria
2. This for handling error during bundle deployment to MRT using b2c cli
3. If the first CLI deploy (sfnext push or b2c mrt push) fails due to an unauthorized error, typically due to an incorrect project ID, recommend using the "mrt project list --limit 10" command to get a list of projects the user does have access to
4. project list command should show "ID" instead of "Slug" for column name, for consistency
5. Check if we may need to expose the project list command in the sfnext CLI
6. Make sure to refer to existing patterns and code and reuse them as much as possible
7. Ask clarifying question where needed. DO NOT MAKE CHANGES BASED ON ASSUMPTIONS
8. Make sure all the tests are updated with 100% covered
9. Use Agent teams to execute this
10. At the end give the step by step instruction to test this in local
