import os
import sys
import zipfile
import tarfile
import hashlib
import base64

# Package metadata
NAME = "gupax_mobile"
VERSION = "1.0.0"
SUMMARY = "Standalone Monero & P2Pool mining manager with native terminal UI for Android and Desktop"
AUTHOR = "Gupax Community"
LICENSE = "MIT"

# Ensure gupax_mobile directory exists
os.makedirs("gupax_mobile", exist_ok=True)

# Copy the core script logic into gupax_mobile/cli.py and gupax_mobile/__init__.py
with open("gupax_mobile.py", "r") as f:
    code = f.read()

# Write gupax_mobile/cli.py
with open("gupax_mobile/cli.py", "w") as f:
    f.write(code)

# Write gupax_mobile/__init__.py
with open("gupax_mobile/__init__.py", "w") as f:
    f.write(f'"""{SUMMARY}"""\n__version__ = "{VERSION}"\nfrom .cli import main, GupaxApp\n')

# Write gupax_mobile/__main__.py
with open("gupax_mobile/__main__.py", "w") as f:
    f.write('from .cli import main\nif __name__ == "__main__":\n    main()\n')

# Write setup.py
setup_py = f"""from setuptools import setup, find_packages

setup(
    name="{NAME}",
    version="{VERSION}",
    description="{SUMMARY}",
    long_description=open("README.md").read() if os.path.exists("README.md") else "{SUMMARY}",
    long_description_content_type="text/markdown",
    author="{AUTHOR}",
    license="{LICENSE}",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Environment :: Console",
    ],
    python_requires=">=3.8",
    entry_points={{
        "console_scripts": [
            "gupax={NAME}.cli:main",
            "gupax-mobile={NAME}.cli:main",
        ],
    }},
)
"""
with open("setup.py", "w") as f:
    f.write(setup_py)

# Write pyproject.toml
pyproject_toml = f"""[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "{NAME}"
version = "{VERSION}"
authors = [
  {{ name="{AUTHOR}" }},
]
description = "{SUMMARY}"
readme = "README.md"
requires-python = ">=3.8"
classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Environment :: Console",
]

[project.scripts]
gupax = "{NAME}.cli:main"
gupax-mobile = "{NAME}.cli:main"
"""
with open("pyproject.toml", "w") as f:
    f.write(pyproject_toml)

# Write README.md
readme_md = f"""# Gupax Mobile (Python Edition)

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
"""
with open("README.md", "w") as f:
    f.write(readme_md)

# Now build the .whl (ZIP format conforming to PEP 427)
wheel_filename = f"{NAME}-{VERSION}-py3-none-any.whl"
dist_info = f"{NAME}-{VERSION}.dist-info"

metadata_content = f"""Metadata-Version: 2.1
Name: {NAME}
Version: {VERSION}
Summary: {SUMMARY}
Author: {AUTHOR}
License: {LICENSE}
Requires-Python: >=3.8
Description-Content-Type: text/markdown

{readme_md}
"""

wheel_content = """Wheel-Version: 1.0
Generator: custom-bdist_wheel (1.0)
Root-Is-Purelib: true
Tag: py3-none-any
"""

entry_points_content = f"""[console_scripts]
gupax = {NAME}.cli:main
gupax-mobile = {NAME}.cli:main
"""

def hash_file(data):
    digest = hashlib.sha256(data).digest()
    b64 = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return f"sha256={b64}", len(data)

records = []

with zipfile.ZipFile(wheel_filename, "w", compression=zipfile.ZIP_DEFLATED) as whl:
    # Add python files
    for root, _, files in os.walk(NAME):
        for file in files:
            path = os.path.join(root, file)
            with open(path, "rb") as f:
                data = f.read()
            whl.writestr(path, data)
            h, sz = hash_file(data)
            records.append(f"{path},{h},{sz}")
    
    # Add dist-info files
    meta_bytes = metadata_content.encode("utf-8")
    whl.writestr(f"{dist_info}/METADATA", meta_bytes)
    h, sz = hash_file(meta_bytes)
    records.append(f"{dist_info}/METADATA,{h},{sz}")

    wheel_bytes = wheel_content.encode("utf-8")
    whl.writestr(f"{dist_info}/WHEEL", wheel_bytes)
    h, sz = hash_file(wheel_bytes)
    records.append(f"{dist_info}/WHEEL,{h},{sz}")

    ep_bytes = entry_points_content.encode("utf-8")
    whl.writestr(f"{dist_info}/entry_points.txt", ep_bytes)
    h, sz = hash_file(ep_bytes)
    records.append(f"{dist_info}/entry_points.txt,{h},{sz}")

    top_level_bytes = f"{NAME}\n".encode("utf-8")
    whl.writestr(f"{dist_info}/top_level.txt", top_level_bytes)
    h, sz = hash_file(top_level_bytes)
    records.append(f"{dist_info}/top_level.txt,{h},{sz}")

    records.append(f"{dist_info}/RECORD,,")
    record_content = "\n".join(records) + "\n"
    whl.writestr(f"{dist_info}/RECORD", record_content)

print(f"Created wheel: {wheel_filename}")

# Also build source tarball .tar.gz
sdist_filename = f"{NAME}-{VERSION}.tar.gz"
with tarfile.open(sdist_filename, "w:gz") as tar:
    for fpath in ["setup.py", "pyproject.toml", "README.md"]:
        tar.add(fpath, arcname=f"{NAME}-{VERSION}/{fpath}")
    tar.add(NAME, arcname=f"{NAME}-{VERSION}/{NAME}")
print(f"Created sdist: {sdist_filename}")

# Copy wheel and sdist to public directory for direct download in browser
os.makedirs("public", exist_ok=True)
import shutil
shutil.copy(wheel_filename, f"public/{wheel_filename}")
shutil.copy(sdist_filename, f"public/{sdist_filename}")
print("Copied packages to public directory successfully.")
