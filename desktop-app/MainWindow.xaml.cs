using System;
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
                var options = new CoreWebView2EnvironmentOptions(
                    "--disable-features=BlockInsecurePrivateNetworkRequests --allow-insecure-localhost"
                );
                var env = await CoreWebView2Environment.CreateAsync(null, null, options);
                await webView.EnsureCoreWebView2Async(env);

                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
                webView.CoreWebView2.PermissionRequested += CoreWebView2_PermissionRequested;

                // Load the studio control room
                webView.CoreWebView2.Navigate("http://localhost:3000/session/studio");
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