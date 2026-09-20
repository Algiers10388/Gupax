#!/usr/bin/env python3
"""
Gupax Mobile - Interactive Terminal User Interface (TUI)
==========================================================
ANSI-colored interactive terminal interface for headless environments,
SSH sessions, and mobile Termux without X11.
"""

import sys
import os
import time
import threading
from .core import (
    GupaxApp,
    VERSION,
    DEMO_WALLETS,
    ANDROID_SOC_PROFILES,
    CURATED_NODES,
    mining_thread_worker,
    p2pool_sync_worker
)

class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"
    
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"
    ORANGE = "\033[38;5;208m"
    
    BG_BLACK = "\033[40m"
    BG_DARK = "\033[48;5;234m"
    BG_ORANGE = "\033[48;5;208m"
    BG_GREEN = "\033[48;5;28m"
    BG_RED = "\033[48;5;124m"

def clear_screen():
    sys.stdout.write("\033[2J\033[H")
    sys.stdout.flush()

def render_tui(app: GupaxApp):
    clear_screen()
    C = Colors
    W = 80
    
    header = [
        f"{C.BOLD}{C.ORANGE}╔{'═' * (W - 2)}╗{C.RESET}",
        f"{C.BOLD}{C.ORANGE}║  ⛏  GUPAX MOBILE - MONERO & P2POOL TUI  v{VERSION}{' ' * (W - 53)}║{C.RESET}",
        f"{C.BOLD}{C.ORANGE}╚{'═' * (W - 2)}╝{C.RESET}",
    ]
    for h in header:
        print(h)

    chain_color = C.BRIGHT_YELLOW if app.chain == "mini" else C.BRIGHT_RED
    mining_color = f"{C.BG_GREEN}{C.WHITE}{C.BOLD} MINING {C.RESET}" if app.is_mining else f"{C.BG_DARK}{C.RED}{C.BOLD} STOPPED {C.RESET}"
    pool_short = app.target_pool if len(app.target_pool) < 28 else app.target_pool[:25] + "..."
    
    print(f" Chain: {chain_color}[P2POOL {app.chain.upper()}]{C.RESET} | State: {mining_color} | Threads: {C.CYAN}{app.active_threads} Cores{C.RESET} | Target: {C.WHITE}{pool_short}{C.RESET}")
    print(f"{C.DIM}{'─' * W}{C.RESET}")

    tabs = [
        (1, "1:Dashboard"),
        (2, "2:Miner"),
        (3, "3:P2Pool"),
        (4, "4:ARM Tuning"),
        (5, "5:Nodes"),
        (6, "6:Console Logs")
    ]
    nav_str = " "
    for tid, tname in tabs:
        if app.current_tab == tid:
            nav_str += f"{C.BG_ORANGE}{C.BLACK}{C.BOLD} [{tname}] {C.RESET} "
        else:
            nav_str += f"{C.DIM}[{tname}]{C.RESET} "
    print(nav_str)
    print(f"{C.DIM}{'═' * W}{C.RESET}")

    if app.notification and (time.time() - app.notification_time < 4):
        print(f" {C.BRIGHT_YELLOW}{C.BOLD}► {app.notification}{C.RESET}")
        print(f"{C.DIM}{'─' * W}{C.RESET}")

    if app.current_tab == 1:
        uptime_h = app.uptime_seconds // 3600
        uptime_m = (app.uptime_seconds % 3600) // 60
        uptime_s = app.uptime_seconds % 60
        uptime_str = f"{uptime_h:02d}:{uptime_m:02d}:{uptime_s:02d}"
        
        print(f"{C.BOLD}{C.WHITE} [TELEMETRY & REAL-TIME PERFORMANCE]{C.RESET}")
        print(f"  Hashrate (10s avg):  {C.BRIGHT_GREEN}{C.BOLD}{app.hashrate_10s:8.1f} H/s{C.RESET}   │  Sidechain Height:  {C.CYAN}{app.sidechain_height:,}{C.RESET}")
        print(f"  Hashrate (60s avg):  {C.GREEN}{app.hashrate_60s:8.1f} H/s{C.RESET}   │  Monero Block:      {C.WHITE}{app.mainchain_height:,}{C.RESET}")
        print(f"  Hashrate (15m avg):  {C.GREEN}{app.hashrate_15m:8.1f} H/s{C.RESET}   │  Active Miners:     {C.BRIGHT_MAGENTA}{app.active_miners:,} nodes{C.RESET}")
        print(f"  Peak Hashrate:       {C.YELLOW}{app.peak_hashrate:8.1f} H/s{C.RESET}   │  Sidechain Power:   {C.ORANGE}{app.sidechain_hashrate / 1e6:6.2f} MH/s{C.RESET}")
        print(f"  Accepted Shares:     {C.BRIGHT_GREEN}{app.accepted_shares:8d} shares{C.RESET}│  Block Reward:      {C.YELLOW}~{app.block_reward} XMR{C.RESET}")
        print(f"  Rejected Shares:     {C.RED}{app.rejected_shares:8d} shares{C.RESET}│  PPLNS Window:      {C.WHITE}2,160 blocks (~6h){C.RESET}")
        print(f"  Total Hashes:        {C.WHITE}{app.total_hashes:8,d} h{C.RESET}     │  Mining Uptime:     {C.WHITE}{uptime_str}{C.RESET}")
        print()
        print(f"{C.BOLD}{C.WHITE} [PPLNS SHARE TRACKER & WALLET]{C.RESET}")
        print(f"  Address:   {C.DIM}{app.wallet_address[:32]}...{app.wallet_address[-12:]}{C.RESET}")
        share_status = f"{C.BRIGHT_GREEN}★ Active ({app.shares_in_window} in window)" if app.shares_in_window > 0 else f"{C.YELLOW}0 Shares"
        print(f"  Shares:    {share_status}{C.RESET}   │  Est. Speed: {C.ORANGE}{app.est_hashrate} H/s{C.RESET}")
        print(f"  Unpaid:    {C.WHITE}{app.unpaid_balance:.6f} XMR{C.RESET}               │  Total Paid: {C.GREEN}{app.total_paid:.4f} XMR{C.RESET}")

    elif app.current_tab == 2:
        print(f"{C.BOLD}{C.WHITE} [XMRIG PROCESS CONTROLS & PARAMS]{C.RESET}")
        status_text = f"{C.BRIGHT_GREEN}ACTIVE - Hashing on {app.active_threads} threads" if app.is_mining else f"{C.RED}IDLE (Press [M] to Start)"
        print(f"  Status:         {status_text}{C.RESET}")
        print(f"  Stratum Target: {C.BRIGHT_CYAN}{app.target_pool}{C.RESET}")
        print(f"  Monero Wallet:  {C.WHITE}{app.wallet_address}{C.RESET}")
        print(f"  Thread Count:   {C.ORANGE}{app.active_threads} CPU Cores allocated{C.RESET}")
        print(f"  Core Affinity:  {C.YELLOW}{app.get_affinity_hex()}{C.RESET} (Cores: {app.selected_cores})")
        print()
        print(f"{C.BOLD}{C.WHITE} [QUICK ACTIONS]{C.RESET}")
        print(f"  Press {C.BOLD}[M]{C.RESET} or {C.BOLD}[SPACE]{C.RESET} to Start/Stop Mining")
        print(f"  Press {C.BOLD}[+]{C.RESET} / {C.BOLD}[-]{C.RESET} to change CPU threads (1-8)")
        print(f"  Press {C.BOLD}[E]{C.RESET} to Export config.json & start_xmrig.sh")

    elif app.current_tab == 3:
        daily_xmr = (app.est_hashrate / 2950000000) * (720 * 0.60)
        monthly_xmr = daily_xmr * 30.4
        price_usd = 175.0
        time_to_share = (160000000 / max(1, app.est_hashrate)) / 3600
        
        print(f"{C.BOLD}{C.WHITE} [DECENTRALIZED P2POOL REWARD CALCULATOR]{C.RESET}")
        print(f"  Benchmark Hashrate:       {C.ORANGE}{C.BOLD}{app.est_hashrate} H/s{C.RESET}")
        print(f"  P2Pool Mini Difficulty:   {C.WHITE}~160,000,000 (Ideal for mobile / CPU){C.RESET}")
        print(f"  Est. Time to 1 Share:     {C.BRIGHT_YELLOW}~{time_to_share:.1f} hours continuous{C.RESET}")
        print(f"  Daily Expected Return:    {C.WHITE}{daily_xmr:.6f} XMR{C.RESET} (~${daily_xmr * price_usd:.3f} USD)")
        print(f"  Monthly Expected Return:  {C.BRIGHT_GREEN}{monthly_xmr:.5f} XMR{C.RESET} (~${monthly_xmr * price_usd:.2f} USD)")

    elif app.current_tab == 4:
        soc = ANDROID_SOC_PROFILES[app.active_soc_idx]
        print(f"{C.BOLD}{C.WHITE} [ARM64 BIG.LITTLE PROCESSOR OPTIMIZATION]{C.RESET}")
        print(f"  Selected Profile: {C.ORANGE}{C.BOLD}{soc['name']}{C.RESET}")
        print(f"  Recommended:      {len(soc['recommended_cores'])} threads ({soc['notes']})")
        print()
        cores_str = "  "
        for i in range(8):
            if i in app.selected_cores:
                cores_str += f"{C.BG_ORANGE}{C.BLACK}{C.BOLD} [CORE {i}] {C.RESET} "
            else:
                cores_str += f"{C.BG_DARK}{C.DIM}  Core {i}  {C.RESET} "
        print(cores_str)
        print(f"  Calculated Affinity Hex: {C.BRIGHT_YELLOW}{C.BOLD}{app.get_affinity_hex()}{C.RESET}")

    elif app.current_tab == 5:
        print(f"{C.BOLD}{C.WHITE} [STRATUM PROXY & MONERO DAEMON DIRECTORY]{C.RESET}")
        print(f"{'#':<3} {'Server Name':<30} {'Endpoint':<26} {'Ping':<8}")
        print(f"{C.DIM}{'─' * W}{C.RESET}")
        for idx, node in enumerate(CURATED_NODES, 1):
            is_active = (f"{node['host']}:{node['port']}" == app.target_pool)
            marker = f"{C.BRIGHT_GREEN}★{C.RESET}" if is_active else " "
            ping_str = "—"
            if node["latency"] is not None:
                ping_str = f"{node['latency']}ms"
            print(f"{marker} [{idx}] {node['name']:<28} {node['host'] + ':' + str(node['port']):<26} {ping_str}")

    elif app.current_tab == 6:
        print(f"{C.BOLD}{C.WHITE} [LIVE PROCESS LOG TERMINAL]{C.RESET}")
        print(f"{C.DIM}{'─' * W}{C.RESET}")
        for entry in app.logs[-12:]:
            print(f" {C.DIM}{entry['time']}{C.RESET} [{entry['source']:<6}] {entry['msg']}")

    print(f"\n{C.DIM}{'═' * W}{C.RESET}")
    print(f" {C.BOLD}[1-6]{C.RESET} Tabs │ {C.BOLD}[M/Space]{C.RESET} Mine │ {C.BOLD}[C]{C.RESET} Chain │ {C.BOLD}[+/-]{C.RESET} Threads │ {C.BOLD}[E]{C.RESET} Export │ {C.BOLD}[Q]{C.RESET} Quit")

def get_key_unix():
    import select
    import tty
    import termios
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        rlist, _, _ = select.select([sys.stdin], [], [], 0.3)
        if rlist:
            return sys.stdin.read(1)
        return None
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

def get_key():
    if os.name == "nt":
        import msvcrt
        if msvcrt.kbhit():
            try:
                return msvcrt.getch().decode("utf-8", errors="ignore")
            except Exception:
                return None
        time.sleep(0.3)
        return None
    else:
        try:
            return get_key_unix()
        except Exception:
            time.sleep(0.3)
            return None

def launch_cli(app: GupaxApp = None):
    app = app or GupaxApp()
    t_miner = threading.Thread(target=mining_thread_worker, args=(app,), daemon=True)
    t_sync = threading.Thread(target=p2pool_sync_worker, args=(app,), daemon=True)
    t_miner.start()
    t_sync.start()

    app.ping_all_nodes()

    last_render = 0
    try:
        while app.running:
            now = time.time()
            if now - last_render >= 0.5:
                render_tui(app)
                last_render = now

            ch = get_key()
            if not ch:
                continue

            if ch in ("q", "Q"):
                app.running = False
                break
            elif ch in ("1", "2", "3", "4", "5", "6"):
                app.current_tab = int(ch)
            elif ch in ("m", "M", " "):
                app.toggle_mining()
            elif ch in ("c", "C"):
                app.toggle_chain()
            elif ch in ("+", "="):
                with app.lock:
                    app.active_threads = min(8, app.active_threads + 1)
            elif ch in ("-", "_"):
                with app.lock:
                    app.active_threads = max(1, app.active_threads - 1)
            elif ch in ("e", "E"):
                app.export_configs()
            elif ch in ("p", "P"):
                app.ping_all_nodes()
            elif ch in ("s", "S") and app.current_tab == 4:
                with app.lock:
                    app.active_soc_idx = (app.active_soc_idx + 1) % len(ANDROID_SOC_PROFILES)
                    soc = ANDROID_SOC_PROFILES[app.active_soc_idx]
                    app.selected_cores = list(soc["recommended_cores"])
                    app.active_threads = len(app.selected_cores)

    except KeyboardInterrupt:
        pass
    finally:
        app.running = False
        clear_screen()
        print("Gupax Mobile terminated cleanly.")
