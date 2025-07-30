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

# Try multiple installation locations
if mv aos /usr/local/bin/ 2>/dev/null; then
    echo "AOS CLI installed to /usr/local/bin/"
    export PATH="/usr/local/bin:$PATH"
elif mv aos /usr/bin/ 2>/dev/null; then
    echo "AOS CLI installed to /usr/bin/"
    export PATH="/usr/bin:$PATH"
else
    # If we can't use system directories, use current directory
    echo "Installing AOS to current directory..."
    export PATH="$PWD:$PATH"
    # Also try to make it available globally
    ln -sf "$PWD/aos" /usr/local/bin/aos 2>/dev/null || true
fi

# Verify installation
if command -v aos &> /dev/null; then
    echo "AOS CLI verified and ready"
    aos --version
else
    echo "AOS CLI installation failed, but continuing..."
fi

if command -v aos &> /dev/null; then
    echo "AOS CLI installed successfully via curl"
    aos --version
    exit 0
fi

echo "Failed to install AOS CLI"
exit 1 