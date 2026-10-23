# GitHub repo root: fold the file list

A Tampermonkey userscript that folds the file listing on a repository's root page
(`github.com/<owner>/<repo>`) by default, so the README moves up. A fold icon in the
latest-commit bar unfolds it again.

```
‹chevron› 35 items   ·   9ffcb46 · Oct 21, 2026   ·   ⏱ History
```

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open [`github-repo-root-fold.user.js`](./github-repo-root-fold.user.js) and accept the install prompt
   (or open the raw URL from your fork/branch).
3. Visit any repository root page.

## Behaviour

- Only runs on repo root pages (`^/<owner>/<repo>/?$`), re-checked on Turbo soft navigation.
- Folded by default; the state persists in `localStorage` under `github-repo-root-fold:folded`
  (`'1'` folded, `'0'` unfolded).
- The toggle is a borderless ghost button mounted as the first control in the latest-commit
  bar's trailing group, next to the commit SHA and the *History* link.
- Chevron points down when unfolded and right when folded; the label reports the item count.

## Why not an existing script

[MAZ01001/CollapsibleGitHubProjectFiles](https://github.com/MAZ01001/CollapsibleGitHubProjectFiles)
does the same thing but targets the pre-2024 listing (`#folders-and-files tbody > tr[id^=folder-row-]`).
GitHub now renders `[data-testid="directory-content"] > table > tr.react-directory-row`,
so that script no longer matches anything.

## DOM contract

Selectors this script depends on:

| purpose | selector |
| --- | --- |
| file listing container | `[data-testid="directory-content"]` |
| listing rows (count) | `.react-directory-row` |
| latest-commit bar | `[data-testid="latest-commit"]` |

The toggle is injected into React-rendered markup, so a re-render of the commit bar can
briefly drop it; a 150 ms debounced `MutationObserver` puts it back.

## Verified

Tested against `github.com/facebook/react` (35 rows):

| check | result |
| --- | --- |
| default state | listing `display:none`, chevron `-90deg` |
| toggle | listing `display:block`, `aria-expanded=true`, `localStorage` = `0` |
| toggle back | listing `display:none`, `localStorage` = `1` |
| re-render | toggle still mounted after expanding/collapsing commit details |
