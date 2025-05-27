# Contributing to Quanta CSS

First off, thanks for considering contributing! 🎉 Your help makes quanta better for everyone.

## 📝 Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to ensure an inclusive and respectful community.

## 🚀 Getting Started

1. **Fork** the repo and **clone** locally:

   ```bash
   git clone https://github.com/devadetayo/quanta-css.git
   cd quanta-css
   ```
2. **Install dependencies**:

   ```bash
   npm install
   ```
3. **Run the dev server** (if applicable for docs/playground):

   ```bash
   npm run dev
   ```
4. **Build** the CSS bundles locally to test your changes:

   ```bash
   npm run build
   ```

## 📂 Project Structure

* **`src/`**: source CSS for utilities, components, tokens
* **`dist/`**: compiled CSS bundles
* **`docs/`**: documentation site source
* **`tools/`**: build scripts and generators

## 🛠️ Contribution Workflow

1. **Branch Naming**: Use a clear prefix: `feat/`, `fix/`, `docs/`, `chore/`, etc.

   ```
   git checkout -b feat/add-button-variant
   ```
2. **Make your changes** in `src/` or `docs/` as appropriate.
3. **Add tests** or examples for new utilities/components. We use simple snapshot tests for basic CSS output.
4. **Update docs**: If you add a new feature or utility, update `docs/` and `README.md`.
5. **Lint and Format**:

   ```bash
   npm run lint    # stylelint, eslint
   npm run format  # Prettier (optional)
   ```
6. **Commit** with a descriptive message:

   ```bash
   git add .
   git commit -m "feat(button): support outline variant"
   ```
7. **Push** your branch and open a Pull Request against `main`.

## 🧪 Testing

* **Build**: `npm run build` should succeed without errors.
* **Lint**: `npm run lint` should pass.
* **Docs Preview**: If docs changed, verify locally via `npm run dev` or your static server.

## 📝 Issues & Feature Requests

* Use the **issue templates**: choose **Bug Report** or **Feature Request**.
* Provide a clear description of the problem or desired enhancement.

## 🔗 Helpful Links

* [Code of Conduct](./CODE_OF_CONDUCT.md)
* [License (MIT)](./LICENSE)
* [Changelog](./CHANGELOG.md)

---

Thanks for helping make Quanta CSS rock! 🚀
