#!/usr/bin/env python3
"""
Gupax Core Engine & Telemetry Module
"""

import os
import sys
import time
import json
import socket
import threading
import random
import urllib.request
import urllib.error

VERSION = "1.1.0"

DEMO_WALLETS = [
    {
        "name": "Monero General Dev Fund",
        "address": "888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkFxbANsAnJYPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H",
    },
    {
        "name": "Gupax Creator Donation",
        "address": "442uJL8FpqbfNmVsTss9sy82Z4qW4G6bCg2Y3Cq3tC2F13Cxg58D1Z26mN7w5RkKz9e27Y15A9M8eP6E4J9A9M8",
    }
]

ANDROID_SOC_PROFILES = [
    {
        "id": "snapdragon-8gen3",
        "name": "Snapdragon 8 Gen 3 (SM8650)",
        "cores": 8,
        "recommended_cores": [1, 2, 3, 4],
        "notes": "4x Cortex-A720 performance cores. Leaves Prime X4 and efficiency A520 cores free."
    },
    {
        "id": "snapdragon-8gen2",
        "name": "Snapdragon 8 Gen 2 (SM8550)",
        "cores": 8,
        "recommended_cores": [1, 2, 3, 4],
        "notes": "4x Cortex-A715/A710 cluster. Balanced ~900-1,400 H/s on passive cooling."
    },
    {
        "id": "snapdragon-888-870",
        "name": "Snapdragon 888 / 870 / 865",
        "cores": 8,
        "recommended_cores": [1, 2, 3],
        "notes": "3x Gold cores. Recommended to prevent aggressive thermal throttling."
    },
    {
        "id": "google-tensor-g3-g4",
        "name": "Google Tensor G3 / G4 (Pixel 8/9)",
        "cores": 9,
        "recommended_cores": [1, 2, 3, 4],
        "notes": "4x A715 cores. Optimal 38C battery temp balance on Pixel devices."
    },
    {
        "id": "mediatek-dimensity",
        "name": "MediaTek Dimensity 9000 / 9200 / 9300",
        "cores": 8,
        "recommended_cores": [1, 2, 3, 4],
        "notes": "Solid ARMv9 execution on big cluster with sustained clocks."
    },
    {
        "id": "generic-arm64",
        "name": "Generic ARM64 Octa-Core (All Phones)",
        "cores": 8,
        "recommended_cores": [2, 3, 4, 5],
        "notes": "Universal safe profile allocating 50% CPU to mining."
    }
]

CURATED_NODES = [
    {
        "name": "P2Pool Mini Stratum (EU)",
        "host": "p2pmd.xmrvsbeast.com",
        "port": 3333,
        "chain": "mini",
        "location": "Frankfurt, Germany",
        "latency": None
    },
    {
        "name": "P2Pool Mini Stratum (US East)",
        "host": "us.p2pool.observer",
        "port": 3333,
        "chain": "mini",
        "location": "Ashburn, USA",
        "latency": None
    },
    {
        "name": "P2Pool Main Stratum",
        "host": "p2pool.io",
        "port": 3333,
        "chain": "main",
        "location": "Amsterdam, NL",
        "latency": None
    },
    {
        "name": "Rino Monero Remote Daemon",
        "host": "node.community.rino.io",
        "port": 18081,
        "chain": "daemon",
        "location": "High-Speed Decentralized",
        "latency": None
    },
    {
        "name": "XMR.pt Public Remote Node",
        "host": "node.xmr.pt",
        "port": 18081,
        "chain": "daemon",
        "location": "Lisbon, Portugal",
        "latency": None
    },
    {
        "name": "Local Desktop Gupax / LAN",
        "host": "127.0.0.1",
        "port": 3333,
        "chain": "mini",
        "location": "Localhost / Home WiFi",
        "latency": None
    }
]

class GupaxApp:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = True
        self.current_tab = 1
        
        self.chain = "mini"
        self.wallet_address = DEMO_WALLETS[0]["address"]
        self.target_pool = "p2pmd.xmrvsbeast.com:3333"
        self.is_mining = False
        self.active_threads = 4
        self.selected_cores = [1, 2, 3, 4]
        self.active_soc_idx = 1
        
        # Telemetry
        self.hashrate_10s = 0.0
        self.hashrate_60s = 0.0
        self.hashrate_15m = 0.0
        self.peak_hashrate = 0.0
        self.accepted_shares = 0
        self.rejected_shares = 0
        self.total_hashes = 0
        self.uptime_seconds = 0
        self.hashrate_history = [0.0] * 30
        
        # P2Pool Network Stats
        self.sidechain_height = 3982450
        self.mainchain_height = 3249180
        self.sidechain_hashrate = 14850000
        self.active_miners = 1390
        self.difficulty = 172000000
        self.block_reward = 0.60
        
        # Miner Address Stats
        self.shares_in_window = 1
        self.total_shares = 14
        self.unpaid_balance = 0.003412
        self.total_paid = 0.1425
        self.est_hashrate = 850
        
        # Listeners / callbacks for GUI updates
        self.log_callbacks = []
        
        # Logs
        self.logs = []
        self.add_log("GUPAX", "info", f"Gupax Mobile v{VERSION} engine initialized.")
        self.add_log("P2POOL", "success", "Connected to P2Pool Mini sidechain. Target difficulty 172M.")
        self.add_log("DAEMON", "info", "Monero mainchain synchronized at height 3,249,180.")

        self.notification = ""
        self.notification_time = 0

    def add_log_callback(self, cb):
        self.log_callbacks.append(cb)

    def add_log(self, source, level, msg):
        entry = {
            "time": time.strftime("%H:%M:%S"),
            "source": source,
            "level": level,
            "msg": msg
        }
        with self.lock:
            self.logs.append(entry)
            if len(self.logs) > 200:
                self.logs.pop(0)
        for cb in self.log_callbacks:
            try:
                cb(entry)
            except Exception:
                pass

    def set_notification(self, text):
        self.notification = text
        self.notification_time = time.time()

    def get_affinity_hex(self):
        mask = 0
        for c in self.selected_cores:
            mask |= (1 << c)
        return f"0x{mask:x}"

    def toggle_mining(self):
        with self.lock:
            self.is_mining = not self.is_mining
            if self.is_mining:
                self.add_log("XMRIG", "info", f"Mining workers started ({self.active_threads} active threads).")
                self.add_log("XMRIG", "info", f"Stratum pool connected: {self.target_pool}")
                self.set_notification(f"Mining STARTED on {self.active_threads} threads!")
            else:
                self.add_log("XMRIG", "warn", "Mining workers stopped.")
                self.set_notification("Mining STOPPED.")

    def toggle_chain(self):
        with self.lock:
            self.chain = "main" if self.chain == "mini" else "mini"
            self.add_log("P2POOL", "info", f"Sidechain switched to P2Pool {self.chain.upper()}")
            self.set_notification(f"Switched sidechain to P2Pool {self.chain.upper()}")

    def export_configs(self, target_dir="."):
        cfg = {
            "autosave": True,
            "cpu": {
                "enabled": True,
                "huge-pages": False,
                "rx": [[1, c] for c in self.selected_cores]
            },
            "pools": [
                {
                    "algo": "rx/0",
                    "coin": "monero",
                    "url": self.target_pool,
                    "user": self.wallet_address,
                    "pass": "gupax-app",
                    "keepalive": True,
                    "tls": False
                }
            ],
            "http": {
                "enabled": True,
                "host": "127.0.0.1",
                "port": 18088
            }
        }
        cfg_path = os.path.join(target_dir, "config.json")
        with open(cfg_path, "w") as f:
            json.dump(cfg, f, indent=2)

        script = f"""#!/data/data/com.termux/files/usr/bin/bash
# ==========================================
# GUPAX MOBILE - Android XMRig / P2Pool Setup
# ==========================================
pkg update -y && pkg install -y git wget proot clang cmake make libuv

# Acquire Android WakeLock (prevents background sleep)
termux-wake-lock

if [ ! -d "xmrig" ]; then
  git clone https://github.com/xmrig/xmrig.git
  mkdir -p xmrig/build && cd xmrig/build
  cmake .. -DWITH_HWLOC=OFF -DWITH_OPENCL=OFF -DWITH_CUDA=OFF
  make -j$(nproc)
else
  cd xmrig/build
fi

./xmrig \\
  -o {self.target_pool} \\
  -u {self.wallet_address} \\
  -p "gupax-android" \\
  -a rx/0 \\
  -t {len(self.selected_cores)} \\
  --cpu-affinity {self.get_affinity_hex()} \\
  --http-enabled \\
  --http-port 18088 \\
  --http-host 0.0.0.0
"""
        sh_path = os.path.join(target_dir, "start_xmrig.sh")
        with open(sh_path, "w") as f:
            f.write(script)
        try:
            os.chmod(sh_path, 0o755)
        except Exception:
            pass

        self.add_log("GUPAX", "success", f"Exported config.json and start_xmrig.sh to {target_dir}")
        self.set_notification("SUCCESS: Exported config.json & start_xmrig.sh!")

    def ping_all_nodes(self, on_finish=None):
        def _run():
            self.set_notification("Testing latency across all nodes...")
            for node in CURATED_NODES:
                try:
                    start = time.time()
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(1.5)
                    s.connect((node["host"], node["port"]))
                    s.close()
                    ms = int((time.time() - start) * 1000)
                    node["latency"] = ms
                except Exception:
                    node["latency"] = 999
            self.set_notification("TCP ping test complete!")
            if on_finish:
                on_finish()
        threading.Thread(target=_run, daemon=True).start()

def mining_thread_worker(app: GupaxApp):
    while app.running:
        time.sleep(1.0)
        with app.lock:
            if not app.is_mining:
                app.hashrate_10s = max(0.0, app.hashrate_10s * 0.7)
                app.hashrate_history.append(app.hashrate_10s)
                if len(app.hashrate_history) > 30:
                    app.hashrate_history.pop(0)
                continue

            base_rate = 210.0
            jitter = (random.random() - 0.5) * 35.0
            current_hs = max(75.0, (app.active_threads * base_rate) + jitter)

            app.total_hashes += int(current_hs)
            app.uptime_seconds += 1
            app.peak_hashrate = max(app.peak_hashrate, current_hs)

            if app.hashrate_10s == 0:
                app.hashrate_10s = current_hs
                app.hashrate_60s = current_hs
                app.hashrate_15m = current_hs
            else:
                app.hashrate_10s = app.hashrate_10s * 0.85 + current_hs * 0.15
                app.hashrate_60s = app.hashrate_60s * 0.95 + current_hs * 0.05
                app.hashrate_15m = app.hashrate_15m * 0.98 + current_hs * 0.02

            app.hashrate_history.append(app.hashrate_10s)
            if len(app.hashrate_history) > 30:
                app.hashrate_history.pop(0)

            # Random share submission simulation
            if random.random() < 0.04:
                if random.random() > 0.02:
                    app.accepted_shares += 1
                    diff_m = round(app.difficulty / 1e6, 1)
                    ms = random.randint(28, 65)
                    app.logs.append({
                        "time": time.strftime("%H:%M:%S"),
                        "source": "P2POOL",
                        "level": "success",
                        "msg": f"accepted ({app.accepted_shares}/{app.rejected_shares}) diff {diff_m}M ({ms}ms)"
                    })
                else:
                    app.rejected_shares += 1
                    app.logs.append({
                        "time": time.strftime("%H:%M:%S"),
                        "source": "P2POOL",
                        "level": "warn",
                        "msg": "share rejected by stratum (stale diff check)"
                    })

def p2pool_sync_worker(app: GupaxApp):
    while app.running:
        time.sleep(20)
        try:
            url = "https://mini.p2pool.observer/api/stats" if app.chain == "mini" else "https://p2pool.observer/api/stats"
            req = urllib.request.Request(url, headers={"User-Agent": "Gupax-Mobile-App/1.1"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    with app.lock:
                        sidechain = data.get("sidechain", {})
                        mainchain = data.get("mainchain", {})
                        app.sidechain_height = sidechain.get("height", app.sidechain_height)
                        app.mainchain_height = mainchain.get("height", app.mainchain_height)
                        app.sidechain_hashrate = sidechain.get("hashrate", app.sidechain_hashrate)
                        app.difficulty = sidechain.get("difficulty", app.difficulty)
                        app.active_miners = data.get("miners_count", app.active_miners)
        except Exception:
            pass
