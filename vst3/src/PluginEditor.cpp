#include "PluginEditor.h"

namespace s2dio
{

S2DioAudioProcessorEditor::S2DioAudioProcessorEditor(S2DioAudioProcessor& p)
    : AudioProcessorEditor(&p), processorRef(p)
{
    setSize(340, 240);

    // Title & Branding (S2DIO Minimal Raycast Aesthetic)
    titleLabel.setText("S2DIO", juce::dontSendNotification);
    titleLabel.setFont(juce::FontOptions(22.0f, juce::Font::bold));
    titleLabel.setColour(juce::Label::textColourId, juce::Colour(0xfff4f4f6));
    titleLabel.setJustificationType(juce::Justification::centred);
    addAndMakeVisible(titleLabel);

    // Subtitle / Status
    statusLabel.setText("DAW Master Bus Ingest Active", juce::dontSendNotification);
    statusLabel.setFont(juce::FontOptions(12.0f, juce::Font::plain));
    statusLabel.setColour(juce::Label::textColourId, juce::Colour(0xff8b8d91));
    statusLabel.setJustificationType(juce::Justification::centred);
    addAndMakeVisible(statusLabel);

    // Port readout
    portLabel.setText("Local Bridge: 127.0.0.1:4949", juce::dontSendNotification);
    portLabel.setFont(juce::FontOptions(11.0f, juce::Font::plain));
    portLabel.setColour(juce::Label::textColourId, juce::Colour(0xff57c1ff));
    portLabel.setJustificationType(juce::Justification::centred);
    addAndMakeVisible(portLabel);

    // Open Web Studio Button
    openWebButton.setButtonText("Open Studio Session ->");
    openWebButton.onClick = []() {
        juce::URL("http://localhost:3000").launchInDefaultBrowser();
    };
    addAndMakeVisible(openWebButton);

    startTimerHz(30); // 30fps UI meter refresh
}

S2DioAudioProcessorEditor::~S2DioAudioProcessorEditor()
{
    stopTimer();
}

void S2DioAudioProcessorEditor::paint(juce::Graphics& g)
{
    // Background: S2DIO Dark Minimal Canvas (#07080a)
    g.fillAll(juce::Colour(0xff07080a));

    // Outer subtle border
    g.setColour(juce::Colour(0xff1f2128));
    g.drawRect(getLocalBounds(), 1);

    // Stereo Meter Display
    auto meterArea = getLocalBounds().reduced(40, 90).withHeight(36);
    g.setColour(juce::Colour(0xff12141a));
    g.fillRoundedRectangle(meterArea.toFloat(), 4.0f);
    g.setColour(juce::Colour(0xff222530));
    g.drawRoundedRectangle(meterArea.toFloat(), 4.0f, 1.0f);

    float peakL = processorRef.getPeakDbL();
    float peakR = processorRef.getPeakDbR();

    // Map -60dB..0dB to 0..1
    float normL = juce::jlimit(0.0f, 1.0f, (peakL + 60.0f) / 60.0f);
    float normR = juce::jlimit(0.0f, 1.0f, (peakR + 60.0f) / 60.0f);

    auto barL = meterArea.removeFromTop(meterArea.getHeight() / 2).reduced(4, 3);
    auto barR = meterArea.reduced(4, 3);

    // Green or cyan LED color
    bool isConnected = processorRef.isStreamConnected();
    juce::Colour activeColor = isConnected ? juce::Colour(0xff30d158) : juce::Colour(0xff57c1ff);

    g.setColour(activeColor.withAlpha(0.85f));
    const int barWidthL = static_cast<int>(static_cast<float>(barL.getWidth()) * normL);
    const int barWidthR = static_cast<int>(static_cast<float>(barR.getWidth()) * normR);
    g.fillRoundedRectangle(barL.removeFromLeft(barWidthL).toFloat(), 2.0f);
    g.fillRoundedRectangle(barR.removeFromLeft(barWidthR).toFloat(), 2.0f);

    // Connection Dot Indicator
    auto dotBounds = juce::Rectangle<float>(18.0f, 18.0f, 8.0f, 8.0f);
    g.setColour(isConnected ? juce::Colour(0xff30d158) : juce::Colour(0xff5a5d66));
    g.fillEllipse(dotBounds);
}

void S2DioAudioProcessorEditor::resized()
{
    titleLabel.setBounds(0, 16, getWidth(), 28);
    statusLabel.setBounds(0, 44, getWidth(), 18);
    portLabel.setBounds(0, 62, getWidth(), 18);

    openWebButton.setBounds(getWidth() / 2 - 90, getHeight() - 48, 180, 28);
}

void S2DioAudioProcessorEditor::timerCallback()
{
    repaint();
}

} // namespace s2dio
