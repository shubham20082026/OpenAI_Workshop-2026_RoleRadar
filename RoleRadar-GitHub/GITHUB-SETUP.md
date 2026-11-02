# Put RoleRadar on GitHub

This is a clean source folder, not an already published repository. No remote, Git history, real environment file, credentials, installed dependencies or compiled build is included. The app's MIT license and third-party notices are included.

## 1. Open this exact folder

Open a terminal **inside the folder containing this README and `package.json`**, rather than its parent workspace. Install Git if `git --version` is unavailable, using the [official Git download](https://git-scm.com/downloads).

Review `README.md`, `LICENSE` and the files before publishing. The README credits AI assistance and distinguishes tested behavior from pending validation. Its screenshots are bundled locally.

## 2. Create an empty GitHub repository

Create a repository in your own GitHub account, with your chosen name and visibility. Leave its automatic README/license/gitignore options off, because this folder already has them. Copy the repository's normal HTTPS or SSH URL; do not put a personal access token in it.

## 3. Initialize a new local repository

Run from this folder:

```powershell
git init
git branch -M main
git add .
git status --short
git diff --cached --stat
```

The staged files should include the source, docs, screenshots, blank `.env.example`, lockfile and CI workflow. They should exclude `.env`, `.openai`, `node_modules`, `dist`, logs, data exports and database dumps.

Check the staged names before committing:

```powershell
git diff --cached --name-only
```

If Git needs an author identity, set your own identity locally before the next step. Commit metadata is visible when a repository is public. You can use the noreply address shown in your own GitHub email settings.

```powershell
$authorName = Read-Host 'Your commit author name'
$authorEmail = Read-Host 'Your public or GitHub noreply email'
git config --local user.name "$authorName"
git config --local user.email "$authorEmail"
```

## 4. Commit and push

```powershell
git commit -m "Initial RoleRadar prototype"
$repoUrl = Read-Host 'Paste the empty GitHub repository URL'
git remote add origin "$repoUrl"
git push -u origin main
```

Git may open its normal authentication flow. Complete that yourself. No GitHub password, token or SSH private key belongs in this repository.

The included GitHub Actions workflow should run on the push. Its dependencies and local check commands were verified separately; a remote workflow run is not claimed before a repository exists.

## After pushing

- Check that both README screenshots render.
- Check the Actions result; it runs local tests, type checking and the build without provider secrets.
- Add a repository description such as: **Remote internship discovery with transparent skill evidence and a private shortlist.**
- Suitable topics include `react`, `vite`, `supabase`, `internships`, `student-project`, `shadcn-ui` and `chatgpt`.
- Add a live-site URL only after deploying and testing the Node backend. GitHub Pages alone cannot run this app's server.

Keep live service configuration in your local ignored `.env` and your deployment provider's environment settings. If you intentionally add a future integration-test workflow, use dedicated disposable accounts and properly scoped secrets; the current CI does not run those destructive provider tests.
