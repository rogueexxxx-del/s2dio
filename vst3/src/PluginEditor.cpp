#include "PluginEditor.h"

namespace s2dio
{

S2DioAudioProcessorEditor::S2DioAudioProcessorEditor(S2DioAudioProcessor& p)
    : AudioProcessorEditor(&p), processorRef(p)
{
    setSize(370, 270);
    setLookAndFeel(&lookAndFeel);

    // Primary Button: Open Studio Session
    openWebButton.setButtonText("Open Studio Session  ->");
    openWebButton.onClick = []() {
        juce::URL("http://localhost:3000/session/studio").launchInDefaultBrowser();
    };
    addAndMakeVisible(openWebButton);

    // Secondary Button: Copy Local Bridge Port
    copyPortButton.setButtonText("Copy Port: 4949");
    copyPortButton.onClick = [this]() {
        juce::SystemClipboard::copyTextToClipboard("ws://127.0.0.1:4949");
        copyFeedbackTimer = 60; // 2 seconds at 30fps
        copyPortButton.setButtonText("Copied to Clipboard!");
    };
    addAndMakeVisible(copyPortButton);

    // Load authentic vector logo from official geometry
    const juce::String s2dioSvg =
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 798.93 192.1\">"
        "<path fill=\"#ffffff\" d=\"M176.35,62.22c.37,6.08-66.64,7.51-72.03,2.87-4.36-3.69-2.69-6.16-5.39-8.95-4.4-4.55-17.54-4.29-18.33,2.46-.74,6.35,4.31,8.68,9.38,9.93,9.93,2.45,51.63,4.08,60.95,8.12,37.55,16.31,32.77,55.11,25.21,74.31-6.87,17.43-21.83,26.46-39.24,33.17-22.1,8.51-65.06,10.08-88.38,4.47C-4.89,175.75,3.14,129.11,3.55,126.68c1.47-8.9,50.55-6.07,77.06-2.29,1.93,6.11,6.79,10.84,12.94,12.62,8.56,2.26,18.99-9.57,5.91-16.74-9.49-5.19-73.59,3.21-91.15-19.34C-4.63,84.32-2.03,52.55,13.12,28.75,31.36.06,77.21,3.42,107.47,3.63c83.34.59,68.43,51.16,68.88,58.58h0Z\"/>"
        "<path fill=\"#ffffff\" d=\"M193.1,120.84c5.52-10.46,12.56-20.06,20.87-28.47,21.68-22.88,64.96-7.39,63.74-31.4-.34-6.81-12.69-7.05-16.7-2.48-2.46,2.8,1.67,12.14-3.42,12.71-1.33.15-63.98,5.78-67.9-.6-1.28-2.07-.84-9.18-.42-14.25.95-11.78,4.38-50.83,63.96-50.58,27.57.11,69.34-3.59,85.97,25.22,6.48,14.78,8.09,31.25,4.59,47-2.7,11.37-9.45,21.38-18.98,28.15-12.8,9.15-40.5,5.01-49.74,17.7,4.35,1.57,38.22.27,38.5.31,10.82,1.35,11.86-.05,24.06-.38,2-.05.83,11.46.83,12.94,0,9.43.73,22.36,1.21,31.77.3,6.07.69,15.86.35,21.62-4.29.48-8.6.68-12.91.59-8.33,1.22-16.76,1.61-25.17,1.16-26.32-2.74-55.15.48-81.6-.38-6.97-.23-18.85,1.72-26.89-.39-5.29-1.39-5.09-31.77-4.59-37.01.71-7.55-1.22-21.95,4.25-33.23Z\"/>"
        "<path fill=\"#ffffff\" d=\"M505.98,168.74c-12.92,15.53-38.87,17.79-57.08,21.63-26.57,5.6-91.13-4.28-91.13-4.28-.5-7.76-.81-15.51-.93-23.27-.24-16.1.1-31.39,1.36-46.5,1.53-18.23.49-35.99.23-54.07-.17-11.98-6.47-34.01.39-44.73,7.36-11.51,24.42-9.34,35.84-9.91,35.04-1.75,55.89-10.34,88.73,8.82,14.39,8.39,22.77,22.98,27.43,38.48,10.19,33.76,19.85,84.12-4.85,113.84ZM441.97,69.73l-3.12,2.41c-.25,4.71-.26,9.43-.03,14.14.15,3.61.37,7.21.27,10.82-.04,1.26-.95,5.34-.16,6.76,2.75,5.02,9.52.49,11.55-2.28,7.24-9.82,7.67-32.02-8.51-31.85Z\"/>"
        "<path fill=\"#ffffff\" d=\"M611.53,60.54c.4,37.04-.57,86.22-.66,97.39-.07,7.76,3.17,27.46-4.47,31.73-3.85,2.16-68.23,4.46-75.04-1.55-4.86-4.28-2.91-17.48-2.62-23.57.28-5.97,2.02-31.89,2.12-61.53.04-10.61-1.46-22.64-1.46-33.08,0-28.39-.14-52.92-.48-56.39-1.07-10.69,85.21-11.43,83.54-.8-.26,1.65-1.22,22.38-.94,47.8Z\"/>"
        "<path fill=\"#ffffff\" d=\"M795.35,131.17c-9.79,33.19-29.97,55.4-63.82,59.7-13.83,1.76-38.99,1.88-52.13-1.65-19.67-5.29-35.32-14.84-45.76-33.62-4.04-7.27-10.57-19.26-12.02-27.37-5.86-32.84.2-73.26,15.16-94.56,31.27-44.5,100.26-43.65,135.61-4.79,22.33,24.55,32.48,69.98,22.96,102.29ZM722.66,90.26c-.44-5.85-8.93-10.24-12.82-10.12-3.32-.1-6.55,1.11-8.98,3.38-3.64,3.9-4.7,11.89-1.07,15.23,3.66,6.69,11.98,4.86,16.96,2.63,3.98-2.23,6.29-6.57,5.91-11.12Z\"/>"
        "</svg>";
    auto xml = juce::parseXML(s2dioSvg);
    if (xml != nullptr)
        logoDrawable = juce::Drawable::createFromSVG(*xml);

    startTimerHz(30); // 30fps smooth metering
}

S2DioAudioProcessorEditor::~S2DioAudioProcessorEditor()
{
    stopTimer();
    setLookAndFeel(nullptr);
}

void S2DioAudioProcessorEditor::paint(juce::Graphics& g)
{
    // Canvas: S2DIO Dark Obsidian (#07080a)
    g.fillAll(juce::Colour(0xff07080a));

    // Outer hairline border (#1c1e24)
    g.setColour(juce::Colour(0xff1c1e24));
    g.drawRect(getLocalBounds(), 1);

    // 1. Header Section
    // Official S2DIO Vector Logo
    if (logoDrawable != nullptr)
    {
        logoDrawable->drawWithin(g, juce::Rectangle<float>(18.0f, 18.0f, 96.0f, 22.0f),
                                 juce::RectanglePlacement(juce::RectanglePlacement::xLeft | juce::RectanglePlacement::yMid),
                                 1.0f);
    }
    else
    {
        g.setColour(juce::Colour(0xffffffff));
        g.setFont(juce::FontOptions(17.0f, juce::Font::bold));
        g.drawText("S2DIO", 18, 17, 70, 24, juce::Justification::centredLeft);
    }

    // Pill: MASTER BUS
    auto masterPill = juce::Rectangle<float>(122.0f, 21.0f, 78.0f, 17.0f);
    g.setColour(juce::Colour(0xff101116));
    g.fillRoundedRectangle(masterPill, 4.0f);
    g.setColour(juce::Colour(0xff22242c));
    g.drawRoundedRectangle(masterPill, 4.0f, 1.0f);
    g.setColour(juce::Colour(0xff8a8d96));
    g.setFont(juce::FontOptions(9.0f, juce::Font::bold));
    g.drawFittedText("MASTER BUS", masterPill.toNearestInt(), juce::Justification::centred, 1);

    // Live Ingest Status Pill (Right Aligned)
    bool isConnected = processorRef.isStreamConnected();
    auto statusPill = juce::Rectangle<float>(static_cast<float>(getWidth() - 138), 20.0f, 120.0f, 19.0f);

    if (isConnected)
    {
        g.setColour(juce::Colour(0xff0e261a));
        g.fillRoundedRectangle(statusPill, 4.0f);
        g.setColour(juce::Colour(0xff1d4a34));
        g.drawRoundedRectangle(statusPill, 4.0f, 1.0f);

        // Green dot
        g.setColour(juce::Colour(0xff59d499));
        g.fillEllipse(static_cast<float>(statusPill.getX() + 8.0f), static_cast<float>(statusPill.getY() + 6.0f), 7.0f, 7.0f);

        g.setFont(juce::FontOptions(9.5f, juce::Font::bold));
        g.drawText("4949 STREAMING", static_cast<int>(statusPill.getX() + 20), static_cast<int>(statusPill.getY()), 96, static_cast<int>(statusPill.getHeight()), juce::Justification::centredLeft);
    }
    else
    {
        g.setColour(juce::Colour(0xff14151a));
        g.fillRoundedRectangle(statusPill, 4.0f);
        g.setColour(juce::Colour(0xff22242e));
        g.drawRoundedRectangle(statusPill, 4.0f, 1.0f);

        // Crimson dot (waiting)
        g.setColour(juce::Colour(0xffff5757));
        g.fillEllipse(static_cast<float>(statusPill.getX() + 8.0f), static_cast<float>(statusPill.getY() + 6.0f), 7.0f, 7.0f);

        g.setColour(juce::Colour(0xff8a8d98));
        g.setFont(juce::FontOptions(9.5f, juce::Font::bold));
        g.drawText("4949 LISTENING", static_cast<int>(statusPill.getX() + 20), static_cast<int>(statusPill.getY()), 96, static_cast<int>(statusPill.getHeight()), juce::Justification::centredLeft);
    }

    // Divider line
    g.setColour(juce::Colour(0xff16171d));
    g.fillRect(18, 54, getWidth() - 36, 1);

    // 2. Hardware Stereo Peak Meter Card
    auto meterCard = juce::Rectangle<float>(18.0f, 62.0f, static_cast<float>(getWidth() - 36), 84.0f);
    g.setColour(juce::Colour(0xff0c0d12));
    g.fillRoundedRectangle(meterCard, 6.0f);
    g.setColour(juce::Colour(0xff1c1e27));
    g.drawRoundedRectangle(meterCard, 6.0f, 1.0f);

    // Meter Header
    g.setColour(juce::Colour(0xff606470));
    g.setFont(juce::FontOptions(9.0f, juce::Font::bold));
    g.drawText("STEREO PEAK INGEST", static_cast<int>(meterCard.getX() + 10), static_cast<int>(meterCard.getY() + 6), 160, 14, juce::Justification::centredLeft);

    // Clip Indicator (Top Right of Meter Card)
    bool isClipping = (smoothPeakL >= -0.1f || smoothPeakR >= -0.1f);
    auto clipBounds = juce::Rectangle<float>(meterCard.getRight() - 44.0f, meterCard.getY() + 6.0f, 34.0f, 14.0f);
    g.setColour(isClipping ? juce::Colour(0xffff5757) : juce::Colour(0xff181920));
    g.fillRoundedRectangle(clipBounds, 3.0f);
    g.setColour(isClipping ? juce::Colour(0xffffffff) : juce::Colour(0xff454752));
    g.setFont(juce::FontOptions(8.5f, juce::Font::bold));
    g.drawFittedText("CLIP", clipBounds.toNearestInt(), juce::Justification::centred, 1);

    // Meter Bars Geometry
    const float trackX = meterCard.getX() + 32.0f;
    const float trackWidth = meterCard.getWidth() - 110.0f;
    const float barHeight = 9.0f;

    auto drawMeterChannel = [&](const char* label, float y, float peakDb, float peakHold) {
        // Label
        g.setColour(juce::Colour(0xff8a8d99));
        g.setFont(juce::FontOptions(10.0f, juce::Font::bold));
        g.drawText(label, static_cast<int>(meterCard.getX() + 10), static_cast<int>(y - 1), 18, static_cast<int>(barHeight + 2), juce::Justification::centredLeft);

        // Track Background
        auto track = juce::Rectangle<float>(trackX, y, trackWidth, barHeight);
        g.setColour(juce::Colour(0xff14151c));
        g.fillRoundedRectangle(track, 2.0f);

        // Normalize -60dB .. 0dB
        float norm = juce::jlimit(0.0f, 1.0f, (peakDb + 60.0f) / 60.0f);
        if (norm > 0.001f)
        {
            float fillW = trackWidth * norm;
            auto fillRect = juce::Rectangle<float>(trackX, y, fillW, barHeight);

            // Three-color gradient: Green (-60 to -12) -> Amber (-12 to -3) -> Crimson (-3 to 0)
            juce::Colour activeBarCol = (norm > 0.95f) ? juce::Colour(0xffff5757)
                                      : (norm > 0.80f) ? juce::Colour(0xffe5c07b)
                                      : juce::Colour(0xff59d499);
            g.setColour(activeBarCol);
            g.fillRoundedRectangle(fillRect, 2.0f);
        }

        // Peak Hold Tick
        float normHold = juce::jlimit(0.0f, 1.0f, (peakHold + 60.0f) / 60.0f);
        if (normHold > 0.05f)
        {
            float tickX = trackX + (trackWidth * normHold) - 1.0f;
            g.setColour(juce::Colour(0xffffffff));
            g.fillRect(tickX, y, 1.5f, barHeight);
        }

        // dB Text Readout
        juce::String dbText = (peakDb <= -59.5f) ? "-inf dB" : juce::String(peakDb, 1) + " dB";
        g.setColour(juce::Colour(0xffd0d3dc));
        g.setFont(juce::FontOptions(10.0f, juce::Font::plain));
        g.drawText(dbText, static_cast<int>(trackX + trackWidth + 10.0f), static_cast<int>(y - 2), 60, static_cast<int>(barHeight + 4), juce::Justification::centredRight);
    };

    drawMeterChannel("L", meterCard.getY() + 28.0f, smoothPeakL, peakHoldL);
    drawMeterChannel("R", meterCard.getY() + 48.0f, smoothPeakR, peakHoldR);

    // Tick markers legend below bars
    g.setColour(juce::Colour(0xff40434f));
    g.setFont(juce::FontOptions(7.5f, juce::Font::plain));
    g.drawText("-60", static_cast<int>(trackX), static_cast<int>(meterCard.getY() + 66.0f), 24, 10, juce::Justification::centredLeft);
    g.drawText("-24", static_cast<int>(trackX + trackWidth * 0.6f - 10), static_cast<int>(meterCard.getY() + 66.0f), 24, 10, juce::Justification::centred);
    g.drawText("-12", static_cast<int>(trackX + trackWidth * 0.8f - 10), static_cast<int>(meterCard.getY() + 66.0f), 24, 10, juce::Justification::centred);
    g.drawText("0 dB", static_cast<int>(trackX + trackWidth - 24), static_cast<int>(meterCard.getY() + 66.0f), 26, 10, juce::Justification::centredRight);

    // 3. Engine Telemetry Card
    auto telemetryCard = juce::Rectangle<float>(18.0f, 154.0f, static_cast<float>(getWidth() - 36), 52.0f);
    g.setColour(juce::Colour(0xff0c0d12));
    g.fillRoundedRectangle(telemetryCard, 6.0f);
    g.setColour(juce::Colour(0xff1c1e27));
    g.drawRoundedRectangle(telemetryCard, 6.0f, 1.0f);

    // Telemetry Left: Ingest Spec
    g.setColour(juce::Colour(0xff606470));
    g.setFont(juce::FontOptions(8.5f, juce::Font::bold));
    g.drawText("AUDIO INGEST", static_cast<int>(telemetryCard.getX() + 10), static_cast<int>(telemetryCard.getY() + 8), 120, 12, juce::Justification::centredLeft);

    double sampleRate = processorRef.getSampleRate();
    if (sampleRate <= 0.0) sampleRate = 48000.0;
    int blockSize = processorRef.getBlockSize();
    if (blockSize <= 0) blockSize = 256;

    juce::String specStr = juce::String(sampleRate / 1000.0, 1) + " kHz • " + juce::String(blockSize) + " smp • 32-bit float";
    g.setColour(juce::Colour(0xfff0f0f5));
    g.setFont(juce::FontOptions(10.5f, juce::Font::bold));
    g.drawText(specStr, static_cast<int>(telemetryCard.getX() + 10), static_cast<int>(telemetryCard.getY() + 24), 190, 16, juce::Justification::centredLeft);

    // Telemetry Right: Client Link Status
    g.setColour(juce::Colour(0xff606470));
    g.setFont(juce::FontOptions(8.5f, juce::Font::bold));
    g.drawText("CLIENT STATUS", static_cast<int>(telemetryCard.getX() + 200), static_cast<int>(telemetryCard.getY() + 8), 120, 12, juce::Justification::centredLeft);

    int clientCount = processorRef.getClientCount();
    juce::String clientStr = isConnected ? (juce::String(clientCount) + " Studio Connected") : "Waiting for S2DIO App";
    g.setColour(isConnected ? juce::Colour(0xff59d499) : juce::Colour(0xff8a8d98));
    g.setFont(juce::FontOptions(10.5f, juce::Font::bold));
    g.drawText(clientStr, static_cast<int>(telemetryCard.getX() + 200), static_cast<int>(telemetryCard.getY() + 24), 130, 16, juce::Justification::centredLeft);
}

void S2DioAudioProcessorEditor::resized()
{
    // Action Buttons Row
    const int btnY = getHeight() - 48;
    const int btnH = 32;

    openWebButton.setBounds(18, btnY, 210, btnH);
    copyPortButton.setBounds(236, btnY, getWidth() - 254, btnH);
}

void S2DioAudioProcessorEditor::timerCallback()
{
    float currentL = processorRef.getPeakDbL();
    float currentR = processorRef.getPeakDbR();

    // Smooth decay ballistics
    const float decay = 0.82f;
    smoothPeakL = (currentL > smoothPeakL) ? currentL : (smoothPeakL * decay + currentL * (1.0f - decay));
    smoothPeakR = (currentR > smoothPeakR) ? currentR : (smoothPeakR * decay + currentR * (1.0f - decay));

    // Peak hold with 1-second decay
    if (currentL >= peakHoldL)
    {
        peakHoldL = currentL;
        peakHoldTimerL = 30;
    }
    else if (--peakHoldTimerL <= 0)
    {
        peakHoldL -= 1.8f;
    }

    if (currentR >= peakHoldR)
    {
        peakHoldR = currentR;
        peakHoldTimerR = 30;
    }
    else if (--peakHoldTimerR <= 0)
    {
        peakHoldR -= 1.8f;
    }

    // Reset button feedback text
    if (copyFeedbackTimer > 0)
    {
        if (--copyFeedbackTimer == 0)
        {
            copyPortButton.setButtonText("Copy Port: 4949");
        }
    }

    repaint();
}

} // namespace s2dio

