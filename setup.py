import os
from setuptools import setup, find_packages

setup(
    name="gupax_mobile",
    version="1.1.0",
    description="Standalone Monero & P2Pool mining manager with standard Graphical UI (Tkinter) and TUI for Desktop and Mobile",
    long_description=open("README.md").read() if os.path.exists("README.md") else "Standalone Monero & P2Pool mining manager with standard Graphical UI (Tkinter) and TUI for Desktop and Mobile",
    long_description_content_type="text/markdown",
    author="Gupax Community",
    license="MIT",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Environment :: X11 Applications",
        "Environment :: Console",
    ],
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "gupax=gupax_mobile.main:main",
            "gupax-mobile=gupax_mobile.main:main",
        ],
        "gui_scripts": [
            "gupax-gui=gupax_mobile.main:main",
        ],
    },
)
