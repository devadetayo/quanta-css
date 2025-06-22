<p align="center">
  <img src="src/logo/icons.png" alt="Quanta CSS Logo" width="160" />
</p>

**A modern CSS framework built for speed, simplicity, and complete design control.**

> Built with utility-first flexibility and component-based elegance — without the bloat.

![npm version](https://img.shields.io/npm/v/quanta-css)
![build status](https://github.com/devadetayo/quanta-css/actions/workflows/ci.yml/badge.svg)
![license](https://img.shields.io/github/license/devadetayo/quanta-css)

---

**Made by Adeniyi Adetayo ([devadetayo](https://github.com/devadetayo))**

📬 **Connect with me:**

* Twitter: [@devadetayo](https://twitter.com/devadetayo)
* GitHub: [devadetayo](https://github.com/devadetayo)
* LinkedIn: [Adeniyi Adetayo](https://linkedin.com/in/webdevadetayo)

---

## 🚀 What is quanta?

Quanta CSS is a hybrid framework blending utility-first classes with component-based patterns. Stay lean, theme-aware, and production-ready.

---

## 📁 Folder Structure

```plain
quanta-css/
├── dist/             # Compiled CSS output
│   ├── quanta.css         # Full bundle (utilities + components)
│   ├── quanta.min.css     # Minified bundle
│   ├── components.css      # Prebuilt UI components
│   ├── utilities.css       # Core utility classes
│   └── themes           # Theme overrides
├── src/              # Source files
│   ├── components/        # Component CSS sources
│   ├── tokens/            # Design tokens (variables)
│   └── utilities/         # Utility CSS sources
├── tools/            # Build & generator scripts
│   ├── quanta-cli.js
│   └── quanta-generator.js
├── docs/             # Documentation site sources
├── playground.html   # Live editor & preview
├── documentation.html# Documentation entrypoint
├── index.html        # Homepage/landing page
├── package.json
├── postcss.config.js
└── README.md
```

---

## 💾 Installation

### Via npm

```bash
npm install quanta-css
```

### Via CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quantacss@1.0.5/dist/quanta.css">
```

---

## 🚀 Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="path/to/quanta.min.css" />
  <title>quanta Starter</title>
</head>
<body class="p-8 bg-light text-dark">

  <h1 class="text-2xl font-bold mb-4">Hello, quanta!</h1>
  <button class="quanta-btn quanta-bg-primary hover-quanta-bg-secondary">Get Started</button>

</body>
</html>
```

---

## 🔗 Quick Links

* **Documentation:** [https://devadetayo.github.io/quanta-css/documentation.html](https://devadetayo.github.io/quanta-css/documentation.html)
* **Playground:** [https://devadetayo.github.io/quanta-css/playground.html](https://devadetayo.github.io/quanta-css/playground.html)
* **Homepage:** [https://devadetayo.github.io/quanta-css](https://devadetayo.github.io/quanta-css)

---

## 🤝 Contributing

Feel free to file issues, open PRs, or ping me on social. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 🛣️ Roadmap

* [ ] Accordion & Modal JS plugins
* [ ] Official VSCode extension launch
* [ ] RTL & i18n support

---

## 📜 License

Released under the MIT License. See [LICENSE](./LICENSE) for details.

---

> 🍻 Made with ❤️ by Adeniyi Adetayo
> Got feedback? Tweet me [@devadetayo](https://twitter.com/devadetayo) or open an issue!
