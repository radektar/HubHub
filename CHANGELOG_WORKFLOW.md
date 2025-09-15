# CHANGELOG.md Workflow Guide

## Automated Enforcement

The HubHub project now has **automated CHANGELOG.md enforcement** for all commits to the `main` branch.

### How It Works

1. **Pre-commit Hook**: Automatically checks if `CHANGELOG.md` has been updated before allowing commits to `main`
2. **Commit Blocking**: Commits will be blocked with helpful error messages if changelog isn't updated
3. **Branch Protection**: Only applies to `main` branch - feature branches are not affected

### Workflow for Main Branch Commits

1. **Make your code changes**
2. **Update CHANGELOG.md** in the `[Unreleased]` section:
   ```markdown
   ## [Unreleased]
   
   ### Added
   - New feature description
   
   ### Changed  
   - Changes to existing functionality
   
   ### Fixed
   - Bug fixes and corrections
   ```

3. **Stage your changes**:
   ```bash
   git add .
   ```

4. **Commit** (will be automatically approved if changelog is updated):
   ```bash
   git commit -m "feat: your commit message"
   ```

### Changelog Categories

Use these standard categories in your `[Unreleased]` section:

- **`### Added`** - New features, components, or functionality
- **`### Changed`** - Changes to existing functionality  
- **`### Fixed`** - Bug fixes and corrections
- **`### Removed`** - Removed features or deprecated functionality
- **`### Security`** - Security-related changes

### Helper Script

Use the changelog helper script for easier entry management:

```bash
./scripts/update-changelog.sh
```

This script will:
- Show current changelog status
- Guide you through adding entries
- Provide proper formatting examples

### Troubleshooting

#### "COMMIT BLOCKED: CHANGELOG.md must be updated!"

**Solution**: Update the `[Unreleased]` section in `CHANGELOG.md` and stage it:
```bash
# Edit CHANGELOG.md to add your entries
git add CHANGELOG.md
git commit -m "your message"
```

#### "[Unreleased] section appears to be empty"

**Solution**: Add actual changelog entries under appropriate categories:
```markdown
## [Unreleased]

### Added
- Description of what you added
```

#### Working on Feature Branches

The pre-commit hook only applies to `main` branch. Feature branches can be committed normally without changelog updates.

### Manual Override (Emergency Only)

If you absolutely need to bypass the hook (not recommended):
```bash
git commit --no-verify -m "emergency commit message"
```

**Note**: Only use `--no-verify` in genuine emergencies, as it defeats the purpose of maintaining proper changelog history.

## Benefits

- **Consistent Documentation**: Every main branch commit is documented
- **Version Tracking**: Clear history of all changes for releases
- **Team Alignment**: Everyone knows what changed and when
- **Release Preparation**: Changelog is always ready for version releases

