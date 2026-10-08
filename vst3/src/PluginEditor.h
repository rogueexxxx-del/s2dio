#pragma once

#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"

namespace s2dio
{

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

    juce::Label titleLabel;
    juce::Label statusLabel;
    juce::Label portLabel;
    juce::TextButton openWebButton;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(S2DioAudioProcessorEditor)
};

} // namespace s2dio
