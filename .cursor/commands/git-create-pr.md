Cleanup the git history for a pull request.

**Steps to execute (ask for confirmation before each step):**

Note: You may use the following tools as needed:

- git
- GitHub CLI
- the gitKraken MCP

1. Ask me which branch I want to merge this one into (default to 'dev')
2. Note the current branch name (we'll call it `<my-new-branch>`)
3. Take a note of each of the commits that will be squashed and their commit messages. Use the `commit` command to for guidance on generating good commit messages. The changes and commit messages will be used to:
   - generate a concise conventional commit message for the single commit that will be the result of the cleanup
   - generate a useful PR description
4. Push the branch as-is to ensure we don't lose any work: `git push -u origin <my-new-branch>`
5. Ensure the target branch (e.g., 'dev') is up to date:
   - `git fetch --all`
   - `git checkout <target-branch>`
   - `git pull origin <target-branch>`
6. Perform the rebase and push to remote (note that '-X theirs' automatically accepts the current branch's changes if conflicts arise):
   - `git checkout <my-new-branch>`
   - `git rebase -X theirs <target-branch>`
   - `git push -f`
7. Save the un-squashed branch by renaming it: `git branch -m "pre-squash/<my-new-branch>"`
8. Create the squashed branch (same name as original branch), then commit & push:
   - `git checkout <target-branch>`
   - `git merge --squash pre-squash/<my-new-branch>`
   - `git checkout -b <my-new-branch>`
   - `git commit -m "<type>(<optional scope>): <description>"` (use the commit message from step 3)
   - `git push -f`
9. Create a PR from the newly rebased & squashed branch to the target branch. Note: the title of the PR should be the description from the commit. The body of the PR should be the summary/list of changes from step 3: `gh pr create --body <string> --title <string> -B <target-branch>`
