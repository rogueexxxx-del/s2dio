using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;

namespace desktop_app
{
    public partial class MainWindow : Window
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern IntPtr LoadImage(IntPtr hinst, string lpszName, uint uType, int cxDesired, int cyDesired, uint fuLoad);

        private const uint WM_SETICON = 0x0080;
        private const IntPtr ICON_SMALL = 0;
        private const IntPtr ICON_BIG = 1;
        private const uint IMAGE_ICON = 1;
        private const uint LR_LOADFROMFILE = 0x0010;

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            try
            {
                var hwnd = new WindowInteropHelper(this).Handle;
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                string iconPath = Path.Combine(appDir, "app.ico");
                if (File.Exists(iconPath))
                {
                    IntPtr hIconBig = LoadImage(IntPtr.Zero, iconPath, IMAGE_ICON, 32, 32, LR_LOADFROMFILE);
                    IntPtr hIconSmall = LoadImage(IntPtr.Zero, iconPath, IMAGE_ICON, 16, 16, LR_LOADFROMFILE);

                    if (hIconBig != IntPtr.Zero)
                        SendMessage(hwnd, WM_SETICON, ICON_BIG, hIconBig);
                    if (hIconSmall != IntPtr.Zero)
                        SendMessage(hwnd, WM_SETICON, ICON_SMALL, hIconSmall);
                }
            }
            catch { /* Ignore non-critical icon handle exceptions */ }
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                string iconPath = Path.Combine(appDir, "app.ico");
                if (File.Exists(iconPath))
                {
                    Icon = System.Windows.Media.Imaging.BitmapFrame.Create(
                        new Uri(iconPath),
                        System.Windows.Media.Imaging.BitmapCreateOptions.None,
                        System.Windows.Media.Imaging.BitmapCacheOption.OnLoad
                    );
                }
                // Store user data in %LOCALAPPDATA%\S2DIO\WebView2 to prevent 0x80070005 (E_ACCESSDENIED)
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string userDataFolder = Path.Combine(localAppData, "S2DIO", "WebView2");
                Directory.CreateDirectory(userDataFolder);

                var options = new CoreWebView2EnvironmentOptions(
                    "--disable-features=BlockInsecurePrivateNetworkRequests --allow-insecure-localhost"
                );
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, options);
                await webView.EnsureCoreWebView2Async(env);

                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
                webView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 7, 8, 10);
                webView.CoreWebView2.PermissionRequested += CoreWebView2_PermissionRequested;

                // Load self-contained local UI first (instant, 100% offline, zero server dependencies)
                string uiDir = Path.Combine(appDir, "ui");

                if (Directory.Exists(uiDir) && File.Exists(Path.Combine(uiDir, "index.html")))
                {
                    webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                        "appassets.s2dio",
                        uiDir,
                        CoreWebView2HostResourceAccessKind.Allow
                    );
                    webView.CoreWebView2.Navigate("https://appassets.s2dio/index.html");
                }
                else
                {
                    // Fallback to localhost if running in development mode
                    webView.CoreWebView2.Navigate("http://localhost:3000/session/studio");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to initialize S2DIO engine: {ex.Message}", "S2DIO Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void CoreWebView2_PermissionRequested(object? sender, CoreWebView2PermissionRequestedEventArgs e)
        {
            e.State = CoreWebView2PermissionState.Allow;
        }
    }
}