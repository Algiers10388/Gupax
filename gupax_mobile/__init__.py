"""Gupax Mobile - Standalone Monero & P2Pool Mining Application"""
__version__ = "1.1.0"

from .core import GupaxApp
from .main import main
from .cli import launch_cli

try:
    from .gui import launch_gui
except ImportError:
    def launch_gui(*args, **kwargs):
        print("Note: Graphical toolkit (Tkinter) is not installed in this environment.")
        print("Launching Terminal User Interface (TUI) instead...")
        return launch_cli(*args, **kwargs)

__all__ = ["GupaxApp", "main", "launch_gui", "launch_cli"]

