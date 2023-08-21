# ProSkatersPlace-POS-Extension
Extension to convert USD to CAD for ProSkatersPlace POS

# How to use it?
1. Download the script - https://github.com/mylorik/ProSkatersPlace-POS-Extension/archive/refs/heads/main.zip
2. Extract the content of the main.zip to a folder called "ProSkatersPlace-POS-Extension"
3. In Google Chrome go to chrome://extensions/
4. Enable "Developer mode" on the top right corner of the chrome://extensions/ tab
5. On the top left corner click "Load unpacked" and select the "ProSkatersPlace-POS-Extension" folder
6. Done. You should now see a new button called "> Canadian Price <" in the POS cart


# How does it work?
1. It takes the latest exchange rate from exchangerate-api.com and converts USD to CAD.
2. It always "voids" the cart when refreshing the pos page