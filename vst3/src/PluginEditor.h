#pragma once

#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

namespace s2dio
{

class S2DioLookAndFeel : public juce::LookAndFeel_V4
{
public:
    void drawButtonBackground (juce::Graphics& g, juce::Button& button,
                               const juce::Colour& backgroundColour,
                               bool shouldDrawButtonAsHighlighted,
                               bool shouldDrawButtonAsDown) override
    {
        auto bounds = button.getLocalBounds().toFloat();
        juce::Colour bg = shouldDrawButtonAsDown ? juce::Colour(0xff2a2c36)
                        : shouldDrawButtonAsHighlighted ? juce::Colour(0xff22242d)
                        : juce::Colour(0xff16171d);
        juce::Colour border = shouldDrawButtonAsHighlighted ? juce::Colour(0xff3e4250)
                                                            : juce::Colour(0xff262832);
        g.setColour(bg);
        g.fillRoundedRectangle(bounds, 6.0f);
        g.setColour(border);
        g.drawRoundedRectangle(bounds.reduced(0.5f), 6.0f, 1.0f);
    }

    void drawButtonText (juce::Graphics& g, juce::TextButton& button,
                         bool shouldDrawButtonAsHighlighted,
                         bool shouldDrawButtonAsDown) override
    {
        auto font = juce::FontOptions(11.5f, juce::Font::bold);
        g.setFont(font);
        g.setColour(button.isEnabled() ? juce::Colour(0xfff0f0f4) : juce::Colour(0xff60636d));
        g.drawFittedText(button.getButtonText(), button.getLocalBounds(), juce::Justification::centred, 1);
    }
};

class S2DioAudioProcessorEditor : public juce::AudioProcessorEditor,
                                  public juce::Timer
{
public:
    explicit S2DioAudioProcessorEditor(S2DioAudioProcessor&);
    ~S2DioAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;
    void timerCallback() override;

private:
    S2DioAudioProcessor& processorRef;
    S2DioLookAndFeel lookAndFeel;

    juce::TextButton openWebButton;
    juce::TextButton copyPortButton;

    float smoothPeakL = -60.0f;
    float smoothPeakR = -60.0f;
    float peakHoldL = -60.0f;
    float peakHoldR = -60.0f;
    int peakHoldTimerL = 0;
    int peakHoldTimerR = 0;
    int copyFeedbackTimer = 0;
    std::unique_ptr<juce::Drawable> logoDrawable;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(S2DioAudioProcessorEditor)
};

} // namespace s2dio

