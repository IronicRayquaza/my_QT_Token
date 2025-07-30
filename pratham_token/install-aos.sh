#!/bin/bash

echo "Installing AOS CLI..."

# Install AOS CLI using the official method
if command -v npm &> /dev/null; then
    echo "Installing AOS CLI via npm..."
    npm i -g https://get_ao.g8way.io
    
    if command -v aos &> /dev/null; then
        echo "AOS CLI installed successfully"
        aos --version
        exit 0
    else
        echo "AOS CLI installation completed but not found in PATH"
        echo "Trying to find aos in npm global packages..."
        
        # Try to find aos in npm global packages
        NPM_GLOBAL=$(npm config get prefix)
        if [ -f "$NPM_GLOBAL/bin/aos" ]; then
            echo "Found AOS CLI at $NPM_GLOBAL/bin/aos"
            export PATH="$NPM_GLOBAL/bin:$PATH"
        elif [ -f "$NPM_GLOBAL/lib/node_modules/aos/bin/aos" ]; then
            echo "Found AOS CLI in node_modules"
            ln -sf "$NPM_GLOBAL/lib/node_modules/aos/bin/aos" /usr/local/bin/aos 2>/dev/null || true
        fi
    fi
else
    echo "npm not found, cannot install AOS CLI"
    exit 1
fi

# Verify installation
if command -v aos &> /dev/null; then
    echo "AOS CLI verified and ready"
    aos --version
else
    echo "AOS CLI installation failed, but continuing..."
fi 