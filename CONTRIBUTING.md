## Contributing to Turbo

Thank you for considering contributing to Turbo. This document outlines how you can contribute to the project and how to set up your local development environment.

## Project Overview

Turbo is a distributed residential proxy network that allows users to:
- Run client nodes to share bandwidth and earn Bitcoin rewards
- Use the network as a SOCKS5 proxy with high-quality connections
- Self-host server nodes for commercial use

## Setting Up Development Environment

### Installation

#### **Prerequisites**
- Docker and Docker Compose installed

#### **Clone the repository**
```bash
git clone https://github.com/L1shed/Turbo.git
cd Turbo
```

#### **Run the server with Docker Compose**
```bash
cd server/
docker-compose up --build
```

### Testing

You can send test SOCKS requests to server like this:
```bash
curl -x socks5h://username:password@localhost:1080 https://example.com
```

Access nodes stats on server dashboard at `http://localhost:8080/stats`

## How to Contribute

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Reporting Issues

- Use the GitHub issue tracker to report bugs
- Include detailed steps to reproduce the issue
- Specify your environment (OS, Go version, etc.)

## Feature Requests

Feature requests are welcome! Please use the GitHub issue tracker and describe:
- What the feature should do
- Why it would be valuable
- Any implementation ideas you have

## Self-Hosting and Monetization

Turbo is designed to be:

- Self-hostable for commercial purposes
- Customizable for different monetization strategies

You can run server nodes, connect client nodes, and implement your own reward system based on this codebase.

## License

By contributing to Turbo, you agree that your contributions will be licensed under the project's license terms.