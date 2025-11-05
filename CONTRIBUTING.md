# Contributing to GitLab AI Chatbot

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear use case
   - Proposed solution
   - Alternative approaches considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add some AmazingFeature'`)
6. Push to your branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/gitlab-chatbot.git

# Install dependencies
cd gitlab-chatbot/backend
npm install

cd ../frontend
pip install -r requirements.txt

# Create .env files
cp .env.example .env
# Add your API keys

# Run tests
npm test
```

### Code Style

**JavaScript/Node.js:**
- Use ES6+ features
- Follow Airbnb style guide
- Run `npm run lint` before committing

**Python:**
- Follow PEP 8
- Use type hints where applicable
- Run `black` for formatting

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issues when applicable (#123)

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

## Project Structure

```
backend/
  src/
    services/    # Business logic
    routes/      # API endpoints
    middleware/  # Express middleware
    utils/       # Helper functions
    
frontend/
  app.py        # Main Streamlit app
```

## Questions?

Feel free to open an issue with the "question" label.

Thank you for contributing! 🎉
