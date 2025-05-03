# Moji

<img src="static/img/logo.svg" alt="Moji Logo" width="100" height="100">

A modern todo and notepad application for developers, built with Flask and SQLAlchemy. The name "Moji" comes from the Japanese word for "letter" (文字), and our logo represents the letters "MO" in a stylized form.

## Overview

Moji is a personal project that combines task management and note-taking capabilities in a single, developer-friendly application. It's designed to help developers organize their work and thoughts efficiently.

## Features

- **Todo Management**
  - Create and organize todos within projects
  - Mark tasks as complete
  - Track completion history
  - Project-based organization

- **Note-taking**
  - Rich text notes
  - Project-based organization
  - Easy search and retrieval

- **User Management**
  - Secure authentication
  - User profiles
  - License-based feature access

- **Project Organization**
  - Create multiple projects
  - Organize todos and notes by project
  - Project-specific settings

## Future Plans

- GitHub integration for seamless workflow
- Enhanced collaboration features
- API access for developers
- Mobile application support
- Cloud hosting for easy access and deployment
- Docker support for simplified deployment

## Tech Stack

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite (with PostgreSQL support planned)
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: Custom secure authentication system
- **Deployment**: Docker, Cloud hosting (planned)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Noxire-Hash/moji.git
   cd moji
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Set up the database:

   ```bash
   flask db upgrade
   ```

4. Run the application:

   ```bash
   flask run
   ```

## Hosting Plans

Moji will be available as a hosted service in the future, allowing users to:

- Access their todos and notes from anywhere
- Collaborate with team members
- Sync with GitHub repositories
- Use the application without local setup

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Author

- [Noxire-Hash](https://github.com/Noxire-Hash)

## Acknowledgments

- Flask and SQLAlchemy communities for their excellent documentation
- All contributors and supporters of this project
