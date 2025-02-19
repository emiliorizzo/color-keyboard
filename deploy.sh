#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Build the project
rm -rf dist
npm run build

# Navigate into the build output directory
cd dist

# Initialize a new Git repository in the build output directory
git init

# Force add all files, including those ignored by .gitignore
git add -f .

git commit -m 'deploy'

# Push to the gh-pages branch
# Replace <USERNAME> and <REPO> with your GitHub username and repository name
git push -f git@github.com:emiliorizzo/color-keyboard.git master:gh-pages

# Return to the original directory
cd -

echo "Deployment to GitHub Pages complete!"