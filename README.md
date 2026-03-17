# 🎵 Sonic Blob

A stunning, fluid music visualizer extension for Chrome. Sonic Blob uses Three.js and Simplex Noise to create a mesmerizing 3D "blob" that reacts dynamically to your browser's audio.

![Sonic Blob Screenshot](public/favicon.png) <!-- Replace with a real screenshot later -->

## ✨ Features

- **Live Audio Visualization**: Real-time reaction to tab audio using the Chrome `tabCapture` API.
- **Dynamic 3D Geometry**: A smooth, morphing icosahedron powered by Three.js.
- **Micro-Animations**: Fluid transitions and asymmetric attack/release for natural movement.
- **Customizable Appearance**: 
  - Adjust base size, ripple depth, and rotation speed.
  - Tweak sensitivity to match different music genres.
  - Change primary, accent, and background colors with real-time updates.
- **Interactive UI**:
  - Glassmorphic control panel.
  - Fullscreen support.
  - Auto-hiding UI elements for an immersive experience.
- **Persistence**: Your custom configurations are automatically saved to local storage.
- **Config Management**: Download your favorite presets as JSON and upload them back anytime.

## 🚀 Getting Started

### Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/yourusername/sonic-blob.git
    cd sonic-blob
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  Load the extension in Chrome:
    - Open `chrome://extensions/`.
    - Enable **Developer mode**.
    - Click **Load unpacked** and select the `/dist` directory.

### Usage

1.  Open any tab with audio playing (e.g., YouTube, Spotify).
2.  Click the Sonic Blob extension icon.
3.  Enjoy the visualization! Use the **Controls** button to customize the blob.

## 🛠️ Built With

- [Three.js](https://threejs.org/) - 3D Engine
- [Vite](https://vitejs.dev/) - Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Simplex Noise](https://github.com/jwagner/simplex-noise.js) - Smooth procedural deformation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
