# Gupax Mobile (Python Edition)

A standalone Monero and decentralized P2Pool mining manager with a native Terminal User Interface (TUI).

## Installation via pip

### Option A: Install from wheel (.whl)
```bash
pip install gupax_mobile-1.0.0-py3-none-any.whl
```

### Option B: Install from directory or source archive (.tar.gz / .zip)
```bash
pip install gupax_mobile-1.0.0.tar.gz
# or
pip install .
```

## Running the Application
Once installed via pip, run either:
```bash
gupax
```
or
```bash
gupax-mobile
```
or directly via python:
```bash
python3 -m gupax_mobile
```

## Controls
- `[1] - [6]`: Switch tabs (Dashboard, Miner, P2Pool, ARM Tuning, Nodes, Logs)
- `[M]` or `[Space]`: Start / Stop mining simulation
- `[C]`: Switch between P2Pool Mini and Main
- `[+]` / `[-]`: Change CPU thread count
- `[S]`: Cycle mobile phone SoC profiles (Snapdragon, Tensor, Dimensity)
- `[E]`: Export `config.json` and `start_xmrig.sh` for Termux
- `[Q]`: Quit
