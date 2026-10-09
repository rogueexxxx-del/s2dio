using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace desktop_app
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
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
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
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