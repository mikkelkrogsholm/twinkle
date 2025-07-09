# Contributing to Twinkle

Thank you for your interest in contributing to Twinkle! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:
- A clear title and description
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your system information (macOS version, Node.js version)
- Any relevant logs or screenshots

### Suggesting Features

We love feature suggestions! Please open an issue with:
- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you might have

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** and ensure:
   - Code follows the existing style
   - TypeScript types are properly defined
   - Tests pass (when applicable)
   - Documentation is updated
4. **Test your changes**: `npm run build && npm run dev`
5. **Commit your changes** with a clear message
6. **Push to your fork** and submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/twinkle.git
cd twinkle

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the app
npm run build

# Package for testing
npm run package
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

Before submitting a PR:
1. Ensure the app builds without errors: `npm run build`
2. Test the app functionality manually
3. Verify file organization works correctly
4. Check that the UI is responsive

### Areas We Need Help With

- **Cross-platform support**: Extending to Windows and Linux
- **Performance optimization**: Handling large numbers of files
- **UI/UX improvements**: Making the interface more intuitive
- **Additional AI features**: More intelligent file categorization
- **Testing**: Adding unit and integration tests
- **Documentation**: Improving user and developer docs

## Questions?

Feel free to open an issue for any questions about contributing.

## License

By contributing to Twinkle, you agree that your contributions will be licensed under the MIT License.