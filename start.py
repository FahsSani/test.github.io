import os
import shutil
import time
import subprocess
import webbrowser
import sys
import platform
import random

if __name__ == "__main__":
    system = platform.system()

    # Generate a random port between 3000 and 9999
    port = random.randint(3000, 9999)

    # Check the Python version
    if sys.version_info.major == 2:
        # Use Python 2 syntax
        command = 'python -m SimpleHTTPServer {}'.format(port)
    else:
        # Use Python 3 syntax
        if system == 'Windows':
            command = 'python -m http.server {}'.format(port)
        else:
            command = 'python3 -m http.server {}'.format(port)

    # Run the HTTP server command in a subprocess
    process = subprocess.Popen(command.split())

    # Open the localhost in a web browser
    webbrowser.open('http://127.0.0.1:{}/index.html'.format(port))

    # Wait for the process to finish (Ctrl+C to stop the server)
    try:
        process.wait()
    except KeyboardInterrupt:
        # Handle Ctrl+C to stop the server and exit the script
        process.terminate()
        process.wait()
