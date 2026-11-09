#!/usr/bin/env python3
import os
import tarfile
import zipfile
import shutil

VERSION = "1.1.0"
DIST_DIR = "public"
os.makedirs(DIST_DIR, exist_ok=True)

# 1. Build gupax_mobile.zip containing all source files
zip_path = os.path.join(DIST_DIR, "gupax_mobile.zip")
print(f"Building {zip_path}...")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.write("gupax_mobile.py", arcname="gupax_mobile.py")
    zf.write("setup.py", arcname="setup.py")
    zf.write("pyproject.toml", arcname="pyproject.toml")
    if os.path.exists("README.md"):
        zf.write("README.md", arcname="README.md")
    for root, dirs, files in os.walk("gupax_mobile"):
        for f in files:
            if not f.endswith(".pyc") and not "__pycache__" in root:
                full_path = os.path.join(root, f)
                zf.write(full_path, arcname=full_path)

# 2. Build gupax_mobile-1.1.0.tar.gz (sdist)
tar_path = os.path.join(DIST_DIR, f"gupax_mobile-{VERSION}.tar.gz")
print(f"Building {tar_path}...")
with tarfile.open(tar_path, "w:gz") as tf:
    tf.add("gupax_mobile.py", arcname=f"gupax_mobile-{VERSION}/gupax_mobile.py")
    tf.add("setup.py", arcname=f"gupax_mobile-{VERSION}/setup.py")
    tf.add("pyproject.toml", arcname=f"gupax_mobile-{VERSION}/pyproject.toml")
    if os.path.exists("README.md"):
        tf.add("README.md", arcname=f"gupax_mobile-{VERSION}/README.md")
    for root, dirs, files in os.walk("gupax_mobile"):
        for f in files:
            if not f.endswith(".pyc") and not "__pycache__" in root:
                full_path = os.path.join(root, f)
                tf.add(full_path, arcname=f"gupax_mobile-{VERSION}/{full_path}")

# 3. Build gupax_mobile-1.1.0-py3-none-any.whl (PEP 427 wheel format)
whl_path = os.path.join(DIST_DIR, f"gupax_mobile-{VERSION}-py3-none-any.whl")
print(f"Building {whl_path}...")
dist_info = f"gupax_mobile-{VERSION}.dist-info"
with zipfile.ZipFile(whl_path, "w", zipfile.ZIP_DEFLATED) as wf:
    # Package files
    for root, dirs, files in os.walk("gupax_mobile"):
        for f in files:
            if not f.endswith(".pyc") and not "__pycache__" in root:
                full_path = os.path.join(root, f)
                wf.write(full_path, arcname=full_path)
    
    # Wheel metadata
    wf.writestr(f"{dist_info}/WHEEL", "Wheel-Version: 1.0\nGenerator: gupax_packager 1.0\nRoot-Is-Purelib: true\nTag: py3-none-any\n")
    metadata_content = f"""Metadata-Version: 2.1
Name: gupax_mobile
Version: {VERSION}
Summary: Standalone Monero & P2Pool mining manager with standard Graphical UI (Tkinter) and TUI for Desktop and Mobile
Home-page: https://github.com/hinto-janai/gupax
Author: Gupax Community
License: MIT
Classifier: Programming Language :: Python :: 3
Classifier: License :: OSI Approved :: MIT License
Classifier: Operating System :: OS Independent
Requires-Python: >=3.8
Description-Content-Type: text/markdown

# Gupax Mobile v{VERSION}
Monero P2Pool & XMRig Mining Manager for Desktop, Mobile & Termux.
"""
    wf.writestr(f"{dist_info}/METADATA", metadata_content)
    wf.writestr(f"{dist_info}/entry_points.txt", "[console_scripts]\ngupax = gupax_mobile.main:main\ngupax-mobile = gupax_mobile.main:main\n[gui_scripts]\ngupax-gui = gupax_mobile.main:main\n")
    wf.writestr(f"{dist_info}/top_level.txt", "gupax_mobile\n")

# 4. Copy standalone gupax_mobile.py
shutil.copyfile("gupax_mobile.py", os.path.join(DIST_DIR, "gupax_mobile.py"))

print("All packages built successfully in", DIST_DIR)
