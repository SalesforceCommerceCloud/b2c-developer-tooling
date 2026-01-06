// @ts-check

/**
 * Creates a GitHub preview release and uploads tgz assets.
 *
 * @param {Object} params
 * @param {import('@octokit/rest').Octokit} params.github - Octokit instance
 * @param {Object} params.context - GitHub Actions context
 * @param {string} params.version - Version string (e.g., "0.0.1-preview.1")
 * @param {string} params.distDir - Directory containing tgz files
 */
export async function createPreviewRelease({ github, context, version, distDir }) {
  const fs = await import('fs');
  const path = await import('path');

  const tagName = `v${version}`;

  const releaseBody = `## Preview Release ${tagName}

### Installation

Download the tgz file and install:

\`\`\`bash
npm install ./salesforce-b2c-cli-${version}.tgz
\`\`\`

Or install globally:

\`\`\`bash
npm install -g ./salesforce-b2c-cli-${version}.tgz
\`\`\`

> **Note:** The SDK is bundled in the CLI package.
`;

  // Create the release
  const release = await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: tagName,
    name: tagName,
    prerelease: true,
    generate_release_notes: true,
    body: releaseBody,
  });

  console.log(`Created release: ${release.data.html_url}`);

  // Upload all tgz files from dist/
  const files = fs.readdirSync(distDir).filter((f) => f.endsWith('.tgz'));

  for (const file of files) {
    const filePath = path.join(distDir, file);
    const fileData = fs.readFileSync(filePath);

    console.log(`Uploading ${file}...`);

    await github.rest.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: release.data.id,
      name: file,
      data: fileData,
    });

    console.log(`Uploaded ${file}`);
  }

  console.log(`Release complete: ${release.data.html_url}`);
  return release.data.html_url;
}
