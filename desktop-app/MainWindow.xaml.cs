using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace desktop_app
{
    public partial class MainWindow : Window
    {
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                // Store user data in %LOCALAPPDATA%\S2DIO\WebView2 to prevent 0x80070005 (E_ACCESSDENIED) in Program Files
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

                // Ensure local server is reachable, or launch background server if needed
                await EnsureServerRunningAsync();

                // Load the studio control room
                webView.CoreWebView2.Navigate("http://localhost:3000/session/studio");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to initialize S2DIO engine: {ex.Message}", "S2DIO Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async Task EnsureServerRunningAsync()
        {
            // First check if localhost:3000 is already active
            for (int i = 0; i < 3; i++)
            {
                if (await IsServerRespondingAsync())
                {
                    return;
                }
                await Task.Delay(200);
            }

            // If not responding, try to start local node server
            TryStartLocalNodeServer();

            // Wait up to 10 seconds for server to respond
            for (int i = 0; i < 20; i++)
            {
                if (await IsServerRespondingAsync())
                {
                    return;
                }
                await Task.Delay(500);
            }
        }

        private static async Task<bool> IsServerRespondingAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("http://localhost:3000");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        private static void TryStartLocalNodeServer()
        {
            try
            {
                string[] candidatePaths = new[]
                {
                    AppDomain.CurrentDomain.BaseDirectory,
                    @"H:\OPENCODE",
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "S2DIO")
                };

                foreach (var dir in candidatePaths)
                {
                    if (Directory.Exists(dir) && File.Exists(Path.Combine(dir, "package.json")))
                    {
                        var psi = new ProcessStartInfo
                        {
                            FileName = "cmd.exe",
                            Arguments = "/c npm start",
                            WorkingDirectory = dir,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };
                        Process.Start(psi);
                        break;
                    }
                }
            }
            catch
            {
                // Best effort auto-start
            }
        }

        private void CoreWebView2_PermissionRequested(object? sender, CoreWebView2PermissionRequestedEventArgs e)
        {
            e.State = CoreWebView2PermissionState.Allow;
        }
    }
}