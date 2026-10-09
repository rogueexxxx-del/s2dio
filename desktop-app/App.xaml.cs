using System;
using System.Configuration;
using System.Data;
using System.Runtime.InteropServices;
using System.Windows;

namespace desktop_app;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    [DllImport("shell32.dll", SetLastError = true)]
    private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

    protected override void OnStartup(StartupEventArgs e)
    {
        // Explicit unique AppUserModelID prevents Windows Shell from grouping under old blue/default cached icons
        try
        {
            SetCurrentProcessExplicitAppUserModelID("S2DIO.ControlRoom.Studio.v1.0");
        }
        catch { /* Fallback gracefully if Shell API is unavailable */ }

        base.OnStartup(e);
    }
}

