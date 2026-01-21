from setuptools import setup, find_packages

setup(
    name="npp_simulator",
    version="0.1.0",
    description="Web-based NPP Simulator Prototype (LOFW)",
    author="Jules",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi",
        "uvicorn",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.8',
)
