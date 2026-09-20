"""Gupax Mobile - Standalone Monero & P2Pool Mining Application"""
__version__ = "1.1.0"

from .core import GupaxApp
from .main import main
from .gui import launch_gui
from .cli import launch_cli

__all__ = ["GupaxApp", "main", "launch_gui", "launch_cli"]
