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
    auto headerArea = juce::Rectangle<int>(18, 16, getWidth() - 36, 32);

    // S2 Emblem Badge
    auto badgeBounds = juce::Rectangle<float>(18.0f, 16.0f, 26.0f, 26.0f);
    g.setColour(juce::Colour(0xff121318));
    g.fillRoundedRectangle(badgeBounds, 5.0f);
    g.setColour(juce::Colour(0xff272933));
    g.drawRoundedRectangle(badgeBounds, 5.0f, 1.0f);

    g.setColour(juce::Colour(0xffffffff));
    g.setFont(juce::FontOptions(11.0f, juce::Font::bold));
    g.drawFittedText("S2", badgeBounds.toNearestInt(), juce::Justification::centred, 1);

    // Brand Typography: S2DIO
    g.setColour(juce::Colour(0xffffffff));
    g.setFont(juce::FontOptions(17.0f, juce::Font::bold));
    g.drawText("S2DIO", 52, 17, 70, 24, juce::Justification::centredLeft);

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

