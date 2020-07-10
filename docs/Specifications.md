# Top-Level Directory
The top-level directory should be reserved only for things that absolutely need to be at the top for TravBot to work.
- Node.js: `package.json` and `package-lock.json`.
- GitHub: `README.md`, `LICENSE`, and `.gitignore`.
- Other: `.eslintrc.json`.

# The `src` Directory
This directory contains everything related to the actual code that runs TravBot. It contains `index.js`, the entry point for the program, at the top along with subdirectories which separate the code.

# The `data` Directory
This directory is automatically generated upon loading TravBot and contains everything related to dynamic data that shouldn't be committed to GitHub.
- `config.json`: The core data file which holds your bot's token, owners, prefix, etc.

# The `panel` Directory
This directory contains the web panel for the bot which can receive events, request information, and send requests.

# The `docs` Directory
This directory contains information about the bot.