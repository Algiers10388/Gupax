#!/usr/bin/env python3
"""
Gupax Mobile - Main Execution Router
====================================
Automatically launches the native Desktop Graphical Interface (GUI)
when run on a desktop/display system, or switches to the interactive Terminal
Interface (TUI) if executed in a headless terminal or SSH session.
"""

import sys
import os

def has_gui_display():
    """Detect if a graphical window manager / display server is present."""
    if sys.platform in ("win32", "darwin"):
        return True
    # Linux / BSD / Android Termux X11
    if os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"):
        return True
    return False

def main():
    args = sys.argv[1:]

    # Explicit flag checks
    if "--cli" in args or "--tui" in args:
        from .cli import launch_cli
        launch_cli()
        return

    if "--help" in args or "-h" in args:
        print("""Gupax Mobile - Standalone Monero & P2Pool Client

Usage:
  gupax              Launch Desktop Graphical User Interface (GUI)
  gupax --cli        Launch Interactive Terminal User Interface (TUI)
  gupax --gui        Force Desktop GUI Window
  gupax -h, --help   Show this help message
""")
        return

    # Default: Try to launch GUI window
    try:
        if has_gui_display() or "--gui" in args:
            import tkinter
            from .gui import launch_gui
            launch_gui()
            return
        else:
            print("No X11/Wayland graphical display detected ($DISPLAY not set).")
            print("Launching Gupax in interactive Terminal UI (TUI) mode...")
            print("Tip: If you want the GUI window, run on desktop or launch an X11 server.\n")
            from .cli import launch_cli
            launch_cli()
            return
    except ImportError as e:
        print(f"Graphical toolkit (Tkinter) not found: {e}")
        print("Falling back to Terminal UI...\n")
        from .cli import launch_cli
        launch_cli()
    except Exception as e:
        print(f"Could not open GUI window: {e}")
        print("Falling back to Terminal UI...\n")
        from .cli import launch_cli
        launch_cli()

if __name__ == "__main__":
    main()
