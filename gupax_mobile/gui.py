#!/usr/bin/env python3
"""
Gupax Mobile - Standard Desktop GUI Application
================================================
A modern, native desktop application interface built using standard Tkinter & TTK.
Supports Windows, macOS, Linux (X11/Wayland), and Android Termux (via X11/VNC/Proot).
"""

import sys
import os
import time
import json
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

from .core import (
    GupaxApp,
    VERSION,
    DEMO_WALLETS,
    ANDROID_SOC_PROFILES,
    CURATED_NODES,
    mining_thread_worker,
    p2pool_sync_worker
)

# Colors matching Gupax Dark Theme
THEME = {
    "bg": "#0f172a",          # Deep slate background
    "card_bg": "#1e293b",     # Card container
    "card_border": "#334155", # Card border
    "header_bg": "#090d16",   # Top app header
    "accent": "#f97316",      # Monero orange
    "accent_hover": "#ea580c",
    "green": "#22c55e",       # Active / Success
    "green_bg": "#14532d",
    "red": "#ef4444",         # Stopped / Alert
    "red_bg": "#7f1d1d",
    "yellow": "#eab308",
    "cyan": "#06b6d4",
    "text": "#f8fafc",        # Main white text
    "text_muted": "#94a3b8",  # Secondary gray text
    "text_dim": "#64748b",
}

class GupaxGuiApp:
    def __init__(self, root: tk.Tk, app: GupaxApp = None):
        self.root = root
        self.app = app or GupaxApp()
        self.root.title(f"Gupax Mobile - Monero & P2Pool GUI v{VERSION}")
        self.root.geometry("1020x720")
        self.root.minsize(860, 600)
        self.root.configure(bg=THEME["bg"])

        # Set up ttk style
        self.setup_styles()

        # Build UI layout
        self.create_header()
        self.create_notebook()
        self.create_status_bar()

        # Start background workers if not already running
        self.t_miner = threading.Thread(target=mining_thread_worker, args=(self.app,), daemon=True)
        self.t_sync = threading.Thread(target=p2pool_sync_worker, args=(self.app,), daemon=True)
        self.t_miner.start()
        self.t_sync.start()

        # Connect log stream
        self.app.add_log_callback(self.on_new_log)

        # Trigger initial node ping
        self.app.ping_all_nodes(on_finish=self.schedule_refresh_node_list)

        # Start periodic GUI refresh loop (every 300ms)
        self.root.after(300, self.update_gui_loop)

    def setup_styles(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass

        style.configure(".", background=THEME["bg"], foreground=THEME["text"])
        style.configure("TFrame", background=THEME["bg"])
        style.configure("Card.TFrame", background=THEME["card_bg"], relief="flat")
        
        # Notebook (Tabs) styling
        style.configure(
            "TNotebook",
            background=THEME["header_bg"],
            borderwidth=0,
            tabmargins=[10, 8, 10, 0]
        )
        style.configure(
            "TNotebook.Tab",
            background=THEME["card_bg"],
            foreground=THEME["text_muted"],
            padding=[18, 10],
            font=("Helvetica", 10, "bold"),
            borderwidth=0
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", THEME["accent"]), ("active", "#334155")],
            foreground=[("selected", "#000000"), ("active", THEME["text"])]
        )

        # Label styling
        style.configure("Header.TLabel", font=("Helvetica", 14, "bold"), foreground=THEME["text"], background=THEME["header_bg"])
        style.configure("SubHeader.TLabel", font=("Helvetica", 9), foreground=THEME["text_muted"], background=THEME["header_bg"])
        style.configure("CardTitle.TLabel", font=("Helvetica", 11, "bold"), foreground=THEME["accent"], background=THEME["card_bg"])
        style.configure("MetricVal.TLabel", font=("Helvetica", 20, "bold"), foreground=THEME["green"], background=THEME["card_bg"])
        style.configure("MetricLbl.TLabel", font=("Helvetica", 9), foreground=THEME["text_muted"], background=THEME["card_bg"])

        # Buttons
        style.configure(
            "Accent.TButton",
            font=("Helvetica", 10, "bold"),
            background=THEME["accent"],
            foreground="#000000",
            padding=[12, 6]
        )
        style.configure(
            "Card.TButton",
            font=("Helvetica", 9),
            background=THEME["card_border"],
            foreground=THEME["text"],
            padding=[8, 4]
        )

    def create_header(self):
        header_frame = tk.Frame(self.root, bg=THEME["header_bg"], height=64, padx=16, pady=10)
        header_frame.pack(fill=tk.X, side=tk.TOP)

        # Left: Logo & Title
        title_box = tk.Frame(header_frame, bg=THEME["header_bg"])
        title_box.pack(side=tk.LEFT)

        icon_label = tk.Label(title_box, text="⛏", font=("Helvetica", 20), fg=THEME["accent"], bg=THEME["header_bg"])
        icon_label.pack(side=tk.LEFT, padx=(0, 8))

        text_box = tk.Frame(title_box, bg=THEME["header_bg"])
        text_box.pack(side=tk.LEFT)
        tk.Label(text_box, text=f"GUPAX MOBILE", font=("Helvetica", 14, "bold"), fg=THEME["text"], bg=THEME["header_bg"]).pack(anchor=tk.W)
        tk.Label(text_box, text=f"Standard Monero & P2Pool Client v{VERSION}", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["header_bg"]).pack(anchor=tk.W)

        # Right: Quick Badges & Controls
        controls_box = tk.Frame(header_frame, bg=THEME["header_bg"])
        controls_box.pack(side=tk.RIGHT)

        # Chain Toggle Button
        self.chain_btn = tk.Button(
            controls_box,
            text=f"CHAIN: P2POOL {self.app.chain.upper()}",
            font=("Helvetica", 9, "bold"),
            bg="#854d0e",
            fg="#fef08a",
            activebackground=THEME["accent"],
            activeforeground="#000000",
            bd=0,
            padx=10,
            pady=4,
            cursor="hand2",
            command=self.toggle_chain
        )
        self.chain_btn.pack(side=tk.LEFT, padx=6)

        # Mining State Pill
        self.mining_pill = tk.Label(
            controls_box,
            text="● MINER STOPPED",
            font=("Helvetica", 9, "bold"),
            bg=THEME["red_bg"],
            fg="#fca5a5",
            padx=12,
            pady=4
        )
        self.mining_pill.pack(side=tk.LEFT, padx=6)

        # Big Quick Start / Stop Button
        self.header_mine_btn = tk.Button(
            controls_box,
            text="START MINING",
            font=("Helvetica", 9, "bold"),
            bg=THEME["green"],
            fg="#000000",
            activebackground="#16a34a",
            bd=0,
            padx=14,
            pady=4,
            cursor="hand2",
            command=self.toggle_mining
        )
        self.header_mine_btn.pack(side=tk.LEFT, padx=6)

    def create_notebook(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=12, pady=10)

        # Tab Frames
        self.tab_dashboard = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_miner = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_p2pool = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_arm = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_nodes = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_logs = tk.Frame(self.notebook, bg=THEME["bg"])
        self.tab_export = tk.Frame(self.notebook, bg=THEME["bg"])

        self.notebook.add(self.tab_dashboard, text="  Dashboard  ")
        self.notebook.add(self.tab_miner, text="  Miner Controls  ")
        self.notebook.add(self.tab_p2pool, text="  P2Pool & Rewards  ")
        self.notebook.add(self.tab_arm, text="  ARM SoC Optimizer  ")
        self.notebook.add(self.tab_nodes, text="  Nodes & Ping  ")
        self.notebook.add(self.tab_logs, text="  Console Logs  ")
        self.notebook.add(self.tab_export, text="  Termux Export  ")

        # Build each tab
        self.build_dashboard_tab()
        self.build_miner_tab()
        self.build_p2pool_tab()
        self.build_arm_tab()
        self.build_nodes_tab()
        self.build_logs_tab()
        self.build_export_tab()

    # -------------------------------------------------------------
    # TAB 1: DASHBOARD
    # -------------------------------------------------------------
    def build_dashboard_tab(self):
        frame = self.tab_dashboard

        # Top 4 Metric Cards Grid
        metrics_container = tk.Frame(frame, bg=THEME["bg"])
        metrics_container.pack(fill=tk.X, pady=(6, 12))
        for col in range(4):
            metrics_container.columnconfigure(col, weight=1, uniform="m")

        self.lbl_hs_10s = self.make_metric_card(metrics_container, 0, "HASHRATE (10s)", "0.0 H/s", THEME["green"])
        self.lbl_hs_60s = self.make_metric_card(metrics_container, 1, "HASHRATE (60s)", "0.0 H/s", THEME["cyan"])
        self.lbl_hs_peak = self.make_metric_card(metrics_container, 2, "PEAK HASHRATE", "0.0 H/s", THEME["yellow"])
        self.lbl_shares = self.make_metric_card(metrics_container, 3, "ACCEPTED / REJECTED", "0 / 0", THEME["text"])

        # Middle: Hashrate Graph Canvas + Sidechain Info
        mid_container = tk.Frame(frame, bg=THEME["bg"])
        mid_container.pack(fill=tk.BOTH, expand=True, pady=4)
        mid_container.columnconfigure(0, weight=3)
        mid_container.columnconfigure(1, weight=2)

        # Graph Canvas Card
        graph_card = tk.Frame(mid_container, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"])
        graph_card.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        graph_header = tk.Frame(graph_card, bg=THEME["card_bg"], padx=12, pady=8)
        graph_header.pack(fill=tk.X)
        tk.Label(graph_header, text="REAL-TIME HASHRATE TELEMETRY (H/s)", font=("Helvetica", 10, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(side=tk.LEFT)
        self.lbl_graph_sub = tk.Label(graph_header, text="Workers: 4 Threads | RandomX", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"])
        self.lbl_graph_sub.pack(side=tk.RIGHT)

        self.canvas_graph = tk.Canvas(graph_card, bg="#0b1120", highlightthickness=0, height=180)
        self.canvas_graph.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))

        # Right Card: Network Status
        net_card = tk.Frame(mid_container, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=16, pady=12)
        net_card.grid(row=0, column=1, sticky="nsew")

        tk.Label(net_card, text="P2POOL NETWORK TELEMETRY", font=("Helvetica", 10, "bold"), fg=THEME["cyan"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(0, 8))

        self.lbl_net_sidechain = self.make_key_val(net_card, "Sidechain Height:", "3,982,450")
        self.lbl_net_mainchain = self.make_key_val(net_card, "Monero Mainchain Block:", "3,249,180")
        self.lbl_net_miners = self.make_key_val(net_card, "Active Miners on Chain:", "1,390 miners")
        self.lbl_net_power = self.make_key_val(net_card, "Sidechain Total Power:", "14.85 MH/s")
        self.lbl_net_diff = self.make_key_val(net_card, "Target Share Difficulty:", "172.0M")
        self.lbl_net_reward = self.make_key_val(net_card, "Block Reward:", "~0.60 XMR")
        self.lbl_net_window = self.make_key_val(net_card, "PPLNS Share Window:", "2,160 blocks (~6 hrs)")

        # Bottom Card: Miner Wallet & Share Status
        bottom_card = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=16, pady=10)
        bottom_card.pack(fill=tk.X, pady=(10, 0))

        tk.Label(bottom_card, text="MONERO REWARD & SHARE WINDOW STATUS", font=("Helvetica", 10, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        
        b_grid = tk.Frame(bottom_card, bg=THEME["card_bg"])
        b_grid.pack(fill=tk.X, pady=(6, 0))
        for i in range(3):
            b_grid.columnconfigure(i, weight=1)

        self.lbl_share_status = self.make_key_val(b_grid, "Shares in PPLNS Window:", "★ 1 Active Share", 0)
        self.lbl_unpaid = self.make_key_val(b_grid, "Unpaid Balance:", "0.003412 XMR (~$0.60 USD)", 1)
        self.lbl_total_paid = self.make_key_val(b_grid, "Total Paid Lifetime:", "0.142500 XMR (~$24.94 USD)", 2)

    def make_metric_card(self, parent, col, title, initial_val, color):
        card = tk.Frame(parent, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=14, pady=12)
        card.grid(row=0, column=col, padx=4, sticky="nsew")
        tk.Label(card, text=title, font=("Helvetica", 8, "bold"), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        val_lbl = tk.Label(card, text=initial_val, font=("Helvetica", 16, "bold"), fg=color, bg=THEME["card_bg"])
        val_lbl.pack(anchor=tk.W, pady=(4, 0))
        return val_lbl

    def make_key_val(self, parent, key, val, col=None):
        if col is not None:
            container = tk.Frame(parent, bg=THEME["card_bg"])
            container.grid(row=0, column=col, sticky="w", padx=6)
        else:
            container = tk.Frame(parent, bg=THEME["card_bg"])
            container.pack(fill=tk.X, pady=2)
            
        tk.Label(container, text=key, font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        val_lbl = tk.Label(container, text=val, font=("Helvetica", 9, "bold"), fg=THEME["text"], bg=THEME["card_bg"])
        val_lbl.pack(anchor=tk.W)
        return val_lbl

    # -------------------------------------------------------------
    # TAB 2: MINER CONTROLS
    # -------------------------------------------------------------
    def build_miner_tab(self):
        frame = self.tab_miner

        container = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=24, pady=20)
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=16)

        tk.Label(container, text="XMRIG RANDOM-X MINER ENGINE CONTROLS", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(0, 16))

        # Main Start / Stop Button
        self.btn_main_mine = tk.Button(
            container,
            text="▶  START MINING WORKERS",
            font=("Helvetica", 13, "bold"),
            bg=THEME["green"],
            fg="#000000",
            activebackground="#16a34a",
            bd=0,
            padx=28,
            pady=12,
            cursor="hand2",
            command=self.toggle_mining
        )
        self.btn_main_mine.pack(fill=tk.X, pady=(0, 16))

        # Thread allocation slider
        thread_box = tk.Frame(container, bg=THEME["card_bg"])
        thread_box.pack(fill=tk.X, pady=8)
        
        t_header = tk.Frame(thread_box, bg=THEME["card_bg"])
        t_header.pack(fill=tk.X)
        tk.Label(t_header, text="CPU / ARM Mining Threads:", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(side=tk.LEFT)
        self.lbl_slider_val = tk.Label(t_header, text=f"{self.app.active_threads} Cores Active", font=("Helvetica", 10, "bold"), fg=THEME["accent"], bg=THEME["card_bg"])
        self.lbl_slider_val.pack(side=tk.RIGHT)

        self.thread_slider = tk.Scale(
            thread_box,
            from_=1,
            to=8,
            orient=tk.HORIZONTAL,
            bg=THEME["card_bg"],
            fg=THEME["text"],
            troughcolor="#0f172a",
            activebackground=THEME["accent"],
            highlightthickness=0,
            bd=0,
            command=self.on_slider_change
        )
        self.thread_slider.set(self.app.active_threads)
        self.thread_slider.pack(fill=tk.X, pady=4)

        # Monero Wallet Entry
        tk.Label(container, text="Monero Primary Payout Address (Primary Stagenet/Mainnet Address):", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(12, 4))
        
        wallet_row = tk.Frame(container, bg=THEME["card_bg"])
        wallet_row.pack(fill=tk.X, pady=(0, 12))
        
        self.entry_wallet = tk.Entry(wallet_row, font=("Courier", 10), bg="#0f172a", fg=THEME["text"], insertbackground=THEME["text"], bd=1, relief="solid")
        self.entry_wallet.insert(0, self.app.wallet_address)
        self.entry_wallet.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6, padx=(0, 8))

        btn_dev_fund = tk.Button(wallet_row, text="Use Dev Fund", font=("Helvetica", 9), bg=THEME["card_border"], fg=THEME["text"], bd=0, padx=10, pady=6, cursor="hand2", command=self.set_dev_wallet)
        btn_dev_fund.pack(side=tk.LEFT)

        # Stratum URL Entry
        tk.Label(container, text="Stratum Pool Endpoint (Host:Port):", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(4, 4))
        
        pool_row = tk.Frame(container, bg=THEME["card_bg"])
        pool_row.pack(fill=tk.X, pady=(0, 16))

        self.entry_pool = tk.Entry(pool_row, font=("Courier", 10), bg="#0f172a", fg=THEME["text"], insertbackground=THEME["text"], bd=1, relief="solid")
        self.entry_pool.insert(0, self.app.target_pool)
        self.entry_pool.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6, padx=(0, 8))

        btn_apply = tk.Button(pool_row, text="Apply Changes", font=("Helvetica", 9, "bold"), bg=THEME["accent"], fg="#000000", bd=0, padx=12, pady=6, cursor="hand2", command=self.apply_miner_settings)
        btn_apply.pack(side=tk.LEFT)

        # Status Summary Grid
        stats_box = tk.Frame(container, bg="#0f172a", bd=1, relief="solid", padx=16, pady=12)
        stats_box.pack(fill=tk.X, pady=8)
        
        tk.Label(stats_box, text="ACTIVE PROCESS TELEMETRY", font=("Helvetica", 9, "bold"), fg=THEME["text_muted"], bg="#0f172a").pack(anchor=tk.W, pady=(0, 4))
        self.lbl_miner_summary = tk.Label(
            stats_box,
            text=f"Process Status: IDLE | Threads: {self.app.active_threads} | Core Affinity: {self.app.get_affinity_hex()} | Uptime: 00:00:00",
            font=("Helvetica", 10),
            fg=THEME["text"],
            bg="#0f172a"
        )
        self.lbl_miner_summary.pack(anchor=tk.W)

    def on_slider_change(self, val):
        threads = int(val)
        with self.app.lock:
            self.app.active_threads = threads
            self.app.selected_cores = list(range(threads))
        self.lbl_slider_val.config(text=f"{threads} Cores Active")
        self.refresh_core_buttons()

    def set_dev_wallet(self):
        self.entry_wallet.delete(0, tk.END)
        self.entry_wallet.insert(0, DEMO_WALLETS[0]["address"])
        self.apply_miner_settings()

    def apply_miner_settings(self):
        w = self.entry_wallet.get().strip()
        p = self.entry_pool.get().strip()
        if w:
            self.app.wallet_address = w
        if p:
            self.app.target_pool = p
        self.app.set_notification("Miner settings updated successfully!")
        self.app.add_log("GUPAX", "info", f"Settings updated. Target: {self.app.target_pool}")

    # -------------------------------------------------------------
    # TAB 3: P2POOL & CALCULATOR
    # -------------------------------------------------------------
    def build_p2pool_tab(self):
        frame = self.tab_p2pool

        top_info = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=20, pady=16)
        top_info.pack(fill=tk.X, padx=20, pady=(16, 8))

        tk.Label(top_info, text="DECENTRALIZED P2POOL REWARD CALCULATOR", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        tk.Label(top_info, text="P2Pool gives 100% block rewards directly via coinbase outputs with 0% pool fee and zero custodian risk.", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(2, 12))

        calc_row = tk.Frame(top_info, bg=THEME["card_bg"])
        calc_row.pack(fill=tk.X)
        
        tk.Label(calc_row, text="Your Mining Hashrate (H/s):", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(side=tk.LEFT, padx=(0, 8))
        self.entry_calc_hs = tk.Entry(calc_row, font=("Helvetica", 10, "bold"), width=12, bg="#0f172a", fg=THEME["accent"], bd=1, relief="solid")
        self.entry_calc_hs.insert(0, "850")
        self.entry_calc_hs.pack(side=tk.LEFT, padx=(0, 12), ipady=4)

        btn_recalc = tk.Button(calc_row, text="Calculate Returns", font=("Helvetica", 9, "bold"), bg=THEME["accent"], fg="#000000", bd=0, padx=12, pady=4, cursor="hand2", command=self.recalculate_p2pool)
        btn_recalc.pack(side=tk.LEFT)

        # Output Results Grid
        res_frame = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=20, pady=16)
        res_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=8)

        self.lbl_calc_time = self.make_key_val(res_frame, "Est. Time to find 1 Share:", "~52.3 hours (continuous mobile mining)")
        self.lbl_calc_daily = self.make_key_val(res_frame, "Daily Expected Return:", "0.000124 XMR (~$0.022 USD)")
        self.lbl_calc_monthly = self.make_key_val(res_frame, "Monthly Expected Return:", "0.003780 XMR (~$0.662 USD)")
        self.lbl_calc_shares_win = self.make_key_val(res_frame, "Expected Shares per Window:", "0.11 shares / 2160 blocks")

        # Explanatory Card
        notes_card = tk.Frame(frame, bg="#0f172a", bd=1, relief="solid", padx=16, pady=12)
        notes_card.pack(fill=tk.X, padx=20, pady=(0, 16))
        tk.Label(notes_card, text="💡 Why P2Pool Mini on Mobile?", font=("Helvetica", 10, "bold"), fg=THEME["yellow"], bg="#0f172a").pack(anchor=tk.W)
        tk.Label(notes_card, text="P2Pool Mini has ~160M difficulty (compared to 500M+ on Main). Mobile devices with 500-1500 H/s find shares much faster, ensuring active participation in the PPLNS reward window.", font=("Helvetica", 9), fg=THEME["text_muted"], bg="#0f172a", wraplength=700, justify=tk.LEFT).pack(anchor=tk.W, pady=(2, 0))

    def recalculate_p2pool(self):
        try:
            hs = float(self.entry_calc_hs.get().strip())
        except ValueError:
            hs = 850.0

        daily_xmr = (hs / 2950000000) * (720 * 0.60)
        monthly_xmr = daily_xmr * 30.4
        price_usd = 175.0
        time_to_share = (160000000 / max(1.0, hs)) / 3600

        self.lbl_calc_time.config(text=f"~{time_to_share:.1f} hours of continuous hashing")
        self.lbl_calc_daily.config(text=f"{daily_xmr:.6f} XMR (~${daily_xmr * price_usd:.3f} USD)")
        self.lbl_calc_monthly.config(text=f"{monthly_xmr:.5f} XMR (~${monthly_xmr * price_usd:.2f} USD)")

    # -------------------------------------------------------------
    # TAB 4: ARM TUNING & SOC PROFILES
    # -------------------------------------------------------------
    def build_arm_tab(self):
        frame = self.tab_arm

        container = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=20, pady=16)
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=16)

        tk.Label(container, text="ARM64 BIG.LITTLE PROCESSOR OPTIMIZATION", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        tk.Label(container, text="Select your smartphone SoC preset to configure thread affinity and avoid thermal throttling.", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(2, 16))

        # SoC Dropdown
        soc_row = tk.Frame(container, bg=THEME["card_bg"])
        soc_row.pack(fill=tk.X, pady=(0, 12))

        tk.Label(soc_row, text="Select SoC Hardware Profile:", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(side=tk.LEFT, padx=(0, 8))
        
        self.soc_var = tk.StringVar(value=ANDROID_SOC_PROFILES[self.app.active_soc_idx]["name"])
        soc_names = [p["name"] for p in ANDROID_SOC_PROFILES]
        
        self.soc_dropdown = ttk.Combobox(soc_row, textvariable=self.soc_var, values=soc_names, state="readonly", width=40)
        self.soc_dropdown.pack(side=tk.LEFT, padx=(0, 8))
        self.soc_dropdown.bind("<<ComboboxSelected>>", self.on_soc_selected)

        self.lbl_soc_notes = tk.Label(container, text=ANDROID_SOC_PROFILES[self.app.active_soc_idx]["notes"], font=("Helvetica", 9, "italic"), fg=THEME["cyan"], bg=THEME["card_bg"])
        self.lbl_soc_notes.pack(anchor=tk.W, pady=(0, 16))

        # Interactive Core Buttons Matrix (8 Cores)
        tk.Label(container, text="Interactive CPU Core Affinity Mask (Click to Toggle):", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(4, 8))

        self.cores_frame = tk.Frame(container, bg=THEME["card_bg"])
        self.cores_frame.pack(fill=tk.X, pady=(0, 12))

        self.core_btns = []
        for i in range(8):
            btn = tk.Button(
                self.cores_frame,
                text=f"Core {i}",
                font=("Helvetica", 10, "bold"),
                bg=THEME["accent"] if i in self.app.selected_cores else "#0f172a",
                fg="#000000" if i in self.app.selected_cores else THEME["text_muted"],
                bd=1,
                relief="solid",
                padx=12,
                pady=10,
                cursor="hand2",
                command=lambda c=i: self.toggle_core(c)
            )
            btn.pack(side=tk.LEFT, padx=4, expand=True, fill=tk.X)
            self.core_btns.append(btn)

        # Affinity Hex Output
        self.lbl_affinity_mask = tk.Label(container, text=f"Calculated CPU Affinity Hex: {self.app.get_affinity_hex()}  (--cpu-affinity {self.app.get_affinity_hex()})", font=("Courier", 11, "bold"), fg=THEME["yellow"], bg=THEME["card_bg"])
        self.lbl_affinity_mask.pack(anchor=tk.W, pady=8)

    def on_soc_selected(self, event):
        name = self.soc_var.get()
        for idx, p in enumerate(ANDROID_SOC_PROFILES):
            if p["name"] == name:
                self.app.active_soc_idx = idx
                self.app.selected_cores = list(p["recommended_cores"])
                self.app.active_threads = len(self.app.selected_cores)
                self.lbl_soc_notes.config(text=p["notes"])
                self.refresh_core_buttons()
                self.thread_slider.set(self.app.active_threads)
                self.app.set_notification(f"Loaded profile: {name}")
                break

    def toggle_core(self, core_idx):
        with self.app.lock:
            if core_idx in self.app.selected_cores:
                if len(self.app.selected_cores) > 1:
                    self.app.selected_cores.remove(core_idx)
            else:
                self.app.selected_cores.append(core_idx)
                self.app.selected_cores.sort()
            self.app.active_threads = len(self.app.selected_cores)
        self.refresh_core_buttons()
        self.thread_slider.set(self.app.active_threads)
        self.app.set_notification(f"Affinity updated: {self.app.get_affinity_hex()}")

    def refresh_core_buttons(self):
        for i, btn in enumerate(self.core_btns):
            is_sel = i in self.app.selected_cores
            btn.config(
                bg=THEME["accent"] if is_sel else "#0f172a",
                fg="#000000" if is_sel else THEME["text_muted"]
            )
        self.lbl_affinity_mask.config(
            text=f"Calculated CPU Affinity Hex: {self.app.get_affinity_hex()}  (--cpu-affinity {self.app.get_affinity_hex()})"
        )

    # -------------------------------------------------------------
    # TAB 5: NODE DIRECTORY & PING
    # -------------------------------------------------------------
    def build_nodes_tab(self):
        frame = self.tab_nodes

        top_row = tk.Frame(frame, bg=THEME["bg"], padx=20, pady=10)
        top_row.pack(fill=tk.X)

        tk.Label(top_row, text="STRATUM PROXY & MONERO DAEMON DIRECTORY", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["bg"]).pack(side=tk.LEFT)
        
        btn_ping = tk.Button(
            top_row,
            text="⚡  Ping All Nodes (TCP Socket)",
            font=("Helvetica", 9, "bold"),
            bg=THEME["cyan"],
            fg="#000000",
            bd=0,
            padx=12,
            pady=6,
            cursor="hand2",
            command=lambda: self.app.ping_all_nodes(on_finish=self.schedule_refresh_node_list)
        )
        btn_ping.pack(side=tk.RIGHT)

        # Node List Container
        self.nodes_container = tk.Frame(frame, bg=THEME["bg"], padx=20)
        self.nodes_container.pack(fill=tk.BOTH, expand=True)

        self.refresh_node_list()

    def schedule_refresh_node_list(self):
        try:
            self.root.after(0, self.refresh_node_list)
        except Exception:
            pass

    def refresh_node_list(self):
        if not hasattr(self, "nodes_container"):
            return
        try:
            if not self.nodes_container.winfo_exists():
                return
            for widget in self.nodes_container.winfo_children():
                widget.destroy()
        except Exception:
            return

        for idx, node in enumerate(CURATED_NODES):
            card = tk.Frame(self.nodes_container, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=14, pady=10)
            card.pack(fill=tk.X, pady=4)

            # Left: Name & Host
            left = tk.Frame(card, bg=THEME["card_bg"])
            left.pack(side=tk.LEFT)

            endpoint = f"{node['host']}:{node['port']}"
            is_active = (endpoint == self.app.target_pool)
            name_color = THEME["green"] if is_active else THEME["text"]
            prefix = "★ [ACTIVE] " if is_active else ""

            tk.Label(left, text=f"{prefix}{node['name']}", font=("Helvetica", 10, "bold"), fg=name_color, bg=THEME["card_bg"]).pack(anchor=tk.W)
            tk.Label(left, text=f"{endpoint} • {node['location']} • Chain: {node['chain'].upper()}", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W)

            # Right: Ping Badge & Connect Button
            right = tk.Frame(card, bg=THEME["card_bg"])
            right.pack(side=tk.RIGHT)

            ping_ms = node.get("latency")
            if ping_ms is not None:
                p_text = f"{ping_ms} ms"
                p_color = THEME["green"] if ping_ms < 100 else (THEME["yellow"] if ping_ms < 250 else THEME["red"])
            else:
                p_text = "—"
                p_color = THEME["text_muted"]

            tk.Label(right, text=p_text, font=("Helvetica", 10, "bold"), fg=p_color, bg=THEME["card_bg"], width=8).pack(side=tk.LEFT, padx=8)

            btn_conn = tk.Button(
                right,
                text="Connected" if is_active else "Connect",
                font=("Helvetica", 9, "bold"),
                bg=THEME["card_border"] if is_active else THEME["accent"],
                fg=THEME["text_muted"] if is_active else "#000000",
                bd=0,
                padx=10,
                pady=4,
                cursor="hand2" if not is_active else "arrow",
                command=lambda ep=endpoint: self.set_active_pool(ep)
            )
            btn_conn.pack(side=tk.LEFT)

    def set_active_pool(self, endpoint):
        self.app.target_pool = endpoint
        self.entry_pool.delete(0, tk.END)
        self.entry_pool.insert(0, endpoint)
        self.refresh_node_list()
        self.app.set_notification(f"Connected to node: {endpoint}")

    # -------------------------------------------------------------
    # TAB 6: CONSOLE LOGS
    # -------------------------------------------------------------
    def build_logs_tab(self):
        frame = self.tab_logs

        top_bar = tk.Frame(frame, bg=THEME["bg"], padx=20, pady=10)
        top_bar.pack(fill=tk.X)

        tk.Label(top_bar, text="LIVE MINING PROCESS & NETWORK CONSOLE", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["bg"]).pack(side=tk.LEFT)

        btn_clear = tk.Button(top_bar, text="Clear Console", font=("Helvetica", 9), bg=THEME["card_border"], fg=THEME["text"], bd=0, padx=10, pady=4, cursor="hand2", command=self.clear_logs)
        btn_clear.pack(side=tk.RIGHT)

        # Log Text Window with Scrollbar
        log_container = tk.Frame(frame, bg="#0b1120", bd=1, relief="solid", highlightbackground=THEME["card_border"])
        log_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 16))

        self.log_text = tk.Text(log_container, bg="#0b1120", fg="#e2e8f0", font=("Courier", 9), bd=0, wrap=tk.NONE)
        log_scroll = tk.Scrollbar(log_container, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)

        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=6, pady=6)

        # Tag configurations for colors
        self.log_text.tag_config("time", foreground="#64748b")
        self.log_text.tag_config("src_GUPAX", foreground="#d946ef")
        self.log_text.tag_config("src_P2POOL", foreground="#38bdf8")
        self.log_text.tag_config("src_XMRIG", foreground="#4ade80")
        self.log_text.tag_config("src_DAEMON", foreground="#fbbf24")
        self.log_text.tag_config("lvl_success", foreground="#4ade80")
        self.log_text.tag_config("lvl_warn", foreground="#facc15")
        self.log_text.tag_config("lvl_error", foreground="#f87171")
        self.log_text.tag_config("lvl_info", foreground="#e2e8f0")

        # Initial populate
        for entry in self.app.logs:
            self.on_new_log(entry)

    def on_new_log(self, entry):
        if not hasattr(self, "log_text"):
            return
        
        def _append():
            self.log_text.insert(tk.END, f"{entry['time']} ", "time")
            self.log_text.insert(tk.END, f"[{entry['source']:<6}] ", f"src_{entry['source']}")
            self.log_text.insert(tk.END, f"{entry['msg']}\n", f"lvl_{entry['level']}")
            self.log_text.see(tk.END)
        self.root.after(0, _append)

    def clear_logs(self):
        self.log_text.delete("1.0", tk.END)

    # -------------------------------------------------------------
    # TAB 7: TERMUX EXPORT
    # -------------------------------------------------------------
    def build_export_tab(self):
        frame = self.tab_export

        container = tk.Frame(frame, bg=THEME["card_bg"], bd=1, relief="solid", highlightbackground=THEME["card_border"], padx=20, pady=16)
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=16)

        tk.Label(container, text="EXPORT CONFIG & TERMUX AUTOMATION SCRIPT", font=("Helvetica", 14, "bold"), fg=THEME["accent"], bg=THEME["card_bg"]).pack(anchor=tk.W)
        tk.Label(container, text="Export custom XMRig config.json and ready-to-execute Android bash scripts directly to your local storage.", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(2, 16))

        # Action Buttons
        btn_box = tk.Frame(container, bg=THEME["card_bg"])
        btn_box.pack(fill=tk.X, pady=(0, 16))

        btn_save = tk.Button(
            btn_box,
            text="📁  Save config.json & start_xmrig.sh to Directory...",
            font=("Helvetica", 10, "bold"),
            bg=THEME["accent"],
            fg="#000000",
            bd=0,
            padx=16,
            pady=8,
            cursor="hand2",
            command=self.save_export_dialog
        )
        btn_save.pack(side=tk.LEFT, padx=(0, 12))

        # Preview Text box
        tk.Label(container, text="Preview: start_xmrig.sh (Termux Execution Script):", font=("Helvetica", 10, "bold"), fg=THEME["text"], bg=THEME["card_bg"]).pack(anchor=tk.W, pady=(4, 4))

        preview_box = tk.Frame(container, bg="#0f172a", bd=1, relief="solid")
        preview_box.pack(fill=tk.BOTH, expand=True)

        self.preview_text = tk.Text(preview_box, bg="#0f172a", fg="#a5f3fc", font=("Courier", 9), bd=0)
        self.preview_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        self.refresh_export_preview()

    def refresh_export_preview(self):
        script = f"""#!/data/data/com.termux/files/usr/bin/bash
# ==========================================
# GUPAX MOBILE - Android XMRig / P2Pool Setup
# ==========================================
pkg update -y && pkg install -y git wget proot clang cmake make libuv
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
  -o {self.app.target_pool} \\
  -u {self.app.wallet_address} \\
  -p "gupax-android" \\
  -a rx/0 \\
  -t {self.app.active_threads} \\
  --cpu-affinity {self.app.get_affinity_hex()} \\
  --http-enabled \\
  --http-port 18088 \\
  --http-host 0.0.0.0
"""
        self.preview_text.delete("1.0", tk.END)
        self.preview_text.insert(tk.END, script)

    def save_export_dialog(self):
        target_dir = filedialog.askdirectory(title="Select folder to save Gupax configs")
        if target_dir:
            self.app.export_configs(target_dir)
            messagebox.showinfo("Export Successful", f"Saved config.json and start_xmrig.sh to:\n{target_dir}")

    # -------------------------------------------------------------
    # Bottom Status Bar
    # -------------------------------------------------------------
    def create_status_bar(self):
        self.status_bar = tk.Frame(self.root, bg=THEME["header_bg"], height=28, padx=16, pady=4)
        self.status_bar.pack(fill=tk.X, side=tk.BOTTOM)

        self.lbl_status_msg = tk.Label(self.status_bar, text="● System Ready", font=("Helvetica", 9), fg=THEME["green"], bg=THEME["header_bg"])
        self.lbl_status_msg.pack(side=tk.LEFT)

        self.lbl_status_info = tk.Label(self.status_bar, text=f"Chain: {self.app.chain.upper()} | Target: {self.app.target_pool} | Threads: {self.app.active_threads}", font=("Helvetica", 9), fg=THEME["text_muted"], bg=THEME["header_bg"])
        self.lbl_status_info.pack(side=tk.RIGHT)

    # -------------------------------------------------------------
    # Core Actions & Update Loop
    # -------------------------------------------------------------
    def toggle_mining(self):
        self.app.toggle_mining()
        is_m = self.app.is_mining
        
        self.header_mine_btn.config(
            text="STOP MINING" if is_m else "START MINING",
            bg=THEME["red"] if is_m else THEME["green"]
        )
        self.btn_main_mine.config(
            text="■  STOP MINING WORKERS" if is_m else "▶  START MINING WORKERS",
            bg=THEME["red"] if is_m else THEME["green"]
        )
        self.mining_pill.config(
            text="● MINING ACTIVE" if is_m else "● MINER STOPPED",
            bg=THEME["green_bg"] if is_m else THEME["red_bg"],
            fg="#86efac" if is_m else "#fca5a5"
        )

    def toggle_chain(self):
        self.app.toggle_chain()
        self.chain_btn.config(
            text=f"CHAIN: P2POOL {self.app.chain.upper()}",
            bg="#991b1b" if self.app.chain == "main" else "#854d0e",
            fg="#fee2e2" if self.app.chain == "main" else "#fef08a"
        )

    def update_gui_loop(self):
        # Update Dashboard metrics
        self.lbl_hs_10s.config(text=f"{self.app.hashrate_10s:8.1f} H/s")
        self.lbl_hs_60s.config(text=f"{self.app.hashrate_60s:8.1f} H/s")
        self.lbl_hs_peak.config(text=f"{self.app.peak_hashrate:8.1f} H/s")
        self.lbl_shares.config(text=f"{self.app.accepted_shares} / {self.app.rejected_shares}")

        # Update Network Stats
        self.lbl_net_sidechain.config(text=f"{self.app.sidechain_height:,}")
        self.lbl_net_mainchain.config(text=f"{self.app.mainchain_height:,}")
        self.lbl_net_miners.config(text=f"{self.app.active_miners:,} miners")
        self.lbl_net_power.config(text=f"{self.app.sidechain_hashrate / 1e6:.2f} MH/s")

        # Update Miner Summary
        uptime_h = self.app.uptime_seconds // 3600
        uptime_m = (self.app.uptime_seconds % 3600) // 60
        uptime_s = self.app.uptime_seconds % 60
        uptime_str = f"{uptime_h:02d}:{uptime_m:02d}:{uptime_s:02d}"

        state_str = "ACTIVE (Hashing)" if self.app.is_mining else "IDLE (Stopped)"
        self.lbl_miner_summary.config(
            text=f"Status: {state_str} | Threads: {self.app.active_threads} | Affinity: {self.app.get_affinity_hex()} | Total Hashes: {self.app.total_hashes:,} | Uptime: {uptime_str}"
        )

        # Update Notification
        if self.app.notification and (time.time() - self.app.notification_time < 4):
            self.lbl_status_msg.config(text=f"► {self.app.notification}", fg=THEME["yellow"])
        else:
            status_dot = "● MINING ACTIVE" if self.app.is_mining else "● System Ready"
            self.lbl_status_msg.config(text=status_dot, fg=THEME["green"] if self.app.is_mining else THEME["text_muted"])

        # Redraw Hashrate Canvas
        self.draw_hashrate_canvas()

        # Reschedule next tick (300ms)
        self.root.after(300, self.update_gui_loop)

    def draw_hashrate_canvas(self):
        canvas = self.canvas_graph
        w = canvas.winfo_width()
        h = canvas.winfo_height()
        if w < 50 or h < 50:
            return

        canvas.delete("all")

        # Draw grid lines
        for y_pct in [0.25, 0.5, 0.75]:
            gy = int(h * y_pct)
            canvas.create_line(0, gy, w, gy, fill="#1e293b", dash=(3, 3))

        history = self.app.hashrate_history
        if not history:
            return

        max_val = max(500.0, max(history) * 1.2)

        # Build coordinate points
        points = []
        step_x = w / (len(history) - 1) if len(history) > 1 else w
        for i, val in enumerate(history):
            px = int(i * step_x)
            py = int(h - (val / max_val) * (h - 20) - 10)
            points.append((px, py))

        # Fill under curve
        poly_points = [0, h]
        for px, py in points:
            poly_points.extend([px, py])
        poly_points.extend([w, h])
        canvas.create_polygon(poly_points, fill="#0c4a6e", outline="")

        # Draw line
        for i in range(len(points) - 1):
            canvas.create_line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], fill=THEME["cyan"], width=2)

        # Draw current value dot and text
        if points:
            last_x, last_y = points[-1]
            canvas.create_oval(last_x - 4, last_y - 4, last_x + 4, last_y + 4, fill=THEME["accent"], outline="#ffffff")
            canvas.create_text(w - 10, 16, text=f"{self.app.hashrate_10s:.1f} H/s", fill=THEME["accent"], font=("Helvetica", 11, "bold"), anchor="e")

def launch_gui(app: GupaxApp = None):
    root = tk.Tk()
    gui = GupaxGuiApp(root, app)
    root.mainloop()
