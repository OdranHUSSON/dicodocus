# Dicodocus

<p align="center">
  <img src="https://dicodocus.com/wp-content/uploads/2024/12/cropped-DICODOCUSLOGO.png" alt="Dicodocus Logo" width="200"/>
</p>

<p align="center">
  <a href="https://dicodocus.com">dicodocus.com</a>
</p>


<p align="center">
  Revolutionize Your Docusaurus Docs: An AI-powered, open-source documentation editor
</p>

<p align="center">
  <a href="#key-features">Features</a> •
  <a href="#getting-started">Get Started</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#faq">FAQ</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Key Features

### 🎮 Instant Media Upload
Drop images directly into your docs—no more fiddling with file paths or code snippets. Just paste or drag-and-drop, and we'll handle the rest.


### 🌍 AI-Powered Translations
Automatically translate your documentation into multiple languages while maintaining technical accuracy and natural flow.

### ✨ Built-In AI Content Generation
Let AI help you draft, expand, or polish your documentation. Perfect for quick starts or comprehensive guides.

### 📊 Missing Translations Analyzer
Easily track and manage your documentation's translation status across all languages.
<p align="center">
  <img src="https://dicodocus.com/wp-content/uploads/2024/12/image-1.png" alt="Dicodocus Missing Translations Analyzer & AI-Powered Translations" width="100%" />
</p>



---

## Getting Started

### Prerequisites

Before setting up Dicodocus, ensure you have the following:

- [Node.js](https://nodejs.org) installed
- A [Docusaurus](https://docusaurus.io) project
- An OpenAI API key for AI-powered features

### Installation & Setup

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-repo/dicodocus.git
   cd dicodocus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the required environment variables:
   Create a `.env.local` file in the root of the project:
   ```env
   DOCUSAURUS_ROOT_PATH=/path/to/docusaurus/root
   NEXT_PUBLIC_DOCUSAURUS_DEFAULT_LANG=en
   NEXT_PUBLIC_DOCUSAURUS_URL=http://localhost:3003
   DOCUSAURUS_ENABLED_LANGS=en,es,fr,de
   DOCUSAURUS_MEDIA_DIR=static/img
   OPEN_AI_API_KEY=your-openai-api-key-here
   ```

   Docusaurus_url is used to fetch media ( image / videos ) uploaded to the docusaurus static folder

4. Start the application:
   ```bash
   npm run dev
   ```

---

## How It Works

### 1. Install & Connect
- Install Dicodocus locally or on your server
- Link it to your Docusaurus project
- Configure your preferences and AI settings

### 2. Create or Import Docs
- Import existing documentation
- Create new pages with the AI editor
- Organize content with the visual file explorer

### 3. Translate & Polish
- Generate translations with one click
- Review and refine AI-generated content
- Track missing translations across languages

### 4. Publish or Commit
- Commit changes to your version control
- Watch your Docusaurus site update automatically
- Maintain full control over your content

---

## FAQ

### What is Dicodocus?
Dicodocus is an open-source editor that enhances your Docusaurus documentation workflow. It offers features like inline media uploads, AI-assisted content generation, automatic translations, and a missing translations analyzer—all in one interface.

### How does Dicodocus integrate with Docusaurus?
Dicodocus connects directly to your existing Docusaurus project. You can install it locally or deploy it on a server, then configure it to read and write your Docusaurus docs. After making changes, you can commit them to your version control (e.g., GitHub, GitLab), and your documentation site updates accordingly.

### Do I need coding skills to use Dicodocus?
Basic familiarity with Docusaurus or markdown-based docs is helpful, but you don't need deep coding expertise. Dicodocus provides a visual editor, simple drag-and-drop file management, and AI features to automate tasks.

### Is Dicodocus completely free?
Yes! Dicodocus is free and open source under the [MIT License](LICENSE). We encourage contributions from the community to help improve and maintain the project.

---

## Contributing

We welcome contributions of all kinds! Here's how you can help:

- 🔧 Report bugs and issues
- 💡 Suggest new features
- 📖 Improve documentation
- 🛠️ Submit pull requests

Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## License

MIT © Odran HUSSON

---

<p align="center">
  Made with ❤️ by <a href="https://odran.cc">Odran Husson</a> and sponsored by <a href="https://aismarttalk.tech">AI SmartTalk</a>
</p>

