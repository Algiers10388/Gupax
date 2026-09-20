# Gupax Mobile (Standard Python Application)

A standalone Monero and decentralized P2Pool mining manager with a standard Graphical User Interface (Tkinter GUI) and an interactive Terminal User Interface (TUI).

## Installation via pip

Install the package directly using `pip`:
```bash
pip install gupax_mobile-1.1.0-py3-none-any.whl
```
*(Or install the source archive)*:
```bash
pip install gupax_mobile-1.1.0.tar.gz
```

## Running the Application
Once installed via pip, launch the app from any terminal or command prompt:
```bash
gupax
```
or
```bash
gupax-mobile
```

### Display Modes
- **Standard Desktop GUI**: Launches automatically when running on Windows, macOS, or Linux with an active graphical desktop.
- **Interactive Terminal UI (TUI)**: Automatically activates in headless environments, SSH sessions, or Android Termux without X11. You can also explicitly trigger TUI mode with:
  ```bash
  gupax --cli
  ```

## Features
- **Standard Graphical Window**: Native desktop application window with tabs, dark theme, and high-DPI scaling.
- **Real-time Telemetry**: Live hashrate chart canvas (10s, 60s, 15m, Peak H/s), shares accepted/rejected.
- **Miner Controls**: One-click Start/Stop, CPU thread slider (1–8 cores), Monero payout address configuration.
- **P2Pool Decentralized Rewards**: Real-time sidechain height, difficulty, and automated profit calculator.
- **ARM SoC Optimizer**: Big.LITTLE core affinity pinning for Snapdragon 8 Gen 3/2, Google Tensor, Dimensity to avoid thermal throttling.
- **Node Directory & TCP Ping**: Built-in latency testing to public stratum nodes and remote Monero daemons.
- **1-Click Termux Export**: Generates `config.json` and `start_xmrig.sh` ready for Android devices.
