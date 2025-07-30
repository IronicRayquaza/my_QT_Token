#!/bin/bash

# Install AOS CLI on Render
echo "Installing AOS CLI..."

# Check if aos is already installed
if command -v aos &> /dev/null; then
    echo "AOS CLI is already installed"
    aos --version
    exit 0
fi

# Try to install via npm if available
if command -v npm &> /dev/null; then
    echo "Installing AOS via npm..."
    npm install -g aos
    if command -v aos &> /dev/null; then
        echo "AOS CLI installed successfully via npm"
        aos --version
        exit 0
    fi
fi

# Try to install via curl (alternative method)
echo "Installing AOS via curl..."
curl -L https://github.com/arweave-foundation/ao/releases/latest/download/aos-linux-x64 -o aos
chmod +x aos
# Try to move to /usr/local/bin, if that fails, use current directory
if mv aos /usr/local/bin/ 2>/dev/null; then
    echo "AOS CLI installed to /usr/local/bin/"
else
    # If we can't use /usr/local/bin, use current directory and add to PATH
    echo "Installing AOS to current directory..."
    export PATH="$PWD:$PATH"
    echo "export PATH=\"$PWD:\$PATH\"" >> ~/.bashrc
fi

if command -v aos &> /dev/null; then
    echo "AOS CLI installed successfully via curl"
    aos --version
    exit 0
fi

echo "Failed to install AOS CLI"
exit 1 