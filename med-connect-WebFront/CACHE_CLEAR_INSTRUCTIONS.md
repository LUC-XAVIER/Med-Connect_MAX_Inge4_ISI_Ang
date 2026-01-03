# How to See Your CSS/HTML Changes

If your changes to sidebar, dashboard, or other component CSS/HTML files are not showing up, follow these steps:

## Method 1: Hard Refresh Browser (Quick Fix)
1. **Chrome/Edge**: Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Firefox**: Press `Ctrl + Shift + R` or `Ctrl + F5`
3. **Safari**: Press `Cmd + Shift + R`

## Method 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload"

## Method 3: Restart Angular Dev Server
1. Stop the current dev server (press `Ctrl + C` in the terminal)
2. Navigate to the project folder:
   ```bash
   cd med-connect-WebFront
   ```
3. Start the dev server again:
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve
   ```

## Method 4: Clear Angular Cache (If above don't work)
1. Stop the dev server
2. Delete the `.angular` folder (if it exists):
   ```bash
   rm -rf .angular
   ```
3. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
4. Restart the dev server:
   ```bash
   npm start
   ```

## Common Issues:
- **Changes not appearing**: Usually browser cache - use hard refresh first
- **Build errors**: Check the terminal for error messages
- **Styles not applying**: Make sure CSS files are saved and the dev server has recompiled (watch for "Compiled successfully" message)

## Verify Dev Server is Running:
- You should see: "** Angular Live Development Server is listening on localhost:4200 **"
- Any changes to files should trigger automatic recompilation
- Check the terminal for compilation errors

