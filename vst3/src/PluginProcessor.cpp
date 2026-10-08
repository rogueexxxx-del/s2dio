#ifndef NOMINMAX
#define NOMINMAX
#endif

#include <algorithm>
#include <cmath>
#include "PluginProcessor.h"
#include "PluginEditor.h"

namespace s2dio
{

S2DioAudioProcessor::S2DioAudioProcessor()
    : AudioProcessor(BusesProperties()
                     .withInput("Input", juce::AudioChannelSet::stereo(), true)
                     .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      wsSender(4949)
{
    wsSender.start();
}

S2DioAudioProcessor::~S2DioAudioProcessor()
{
    wsSender.stop();
}

const juce::String S2DioAudioProcessor::getName() const
{
    return JucePlugin_Name;
}

bool S2DioAudioProcessor::acceptsMidi() const { return true; }
bool S2DioAudioProcessor::producesMidi() const { return true; }
bool S2DioAudioProcessor::isMidiEffect() const { return false; }
double S2DioAudioProcessor::getTailLengthSeconds() const { return 0.0; }

int S2DioAudioProcessor::getNumPrograms() { return 1; }
int S2DioAudioProcessor::getCurrentProgram() { return 0; }
void S2DioAudioProcessor::setCurrentProgram(int) {}
const juce::String S2DioAudioProcessor::getProgramName(int) { return {}; }
void S2DioAudioProcessor::changeProgramName(int, const juce::String&) {}

void S2DioAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    juce::ignoreUnused(sampleRate, samplesPerBlock);
    wsSender.start();
}

void S2DioAudioProcessor::releaseResources()
{
}

bool S2DioAudioProcessor::isBusesLayoutSupported(const BusesLayout& layouts) const
{
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::mono()
     && layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;

    return true;
}

void S2DioAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    juce::ignoreUnused(midiMessages);

    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i)
        buffer.clear(i, 0, buffer.getNumSamples());

    const int numSamples = buffer.getNumSamples();
    if (numSamples <= 0) return;

    const float* leftIn = buffer.getReadPointer(0);
    const float* rightIn = totalNumInputChannels > 1 ? buffer.getReadPointer(1) : leftIn;

    // Calculate peaks for GUI meters
    float maxL = 0.0f;
    float maxR = 0.0f;
    for (int i = 0; i < numSamples; ++i)
    {
        maxL = std::max(maxL, std::abs(leftIn[i]));
        maxR = std::max(maxR, std::abs(rightIn[i]));
    }
    peakL.store(juce::Decibels::gainToDecibels(maxL, -60.0f));
    peakR.store(juce::Decibels::gainToDecibels(maxR, -60.0f));

    // Send pristine Float32 master bus samples directly to S2DIO web room
    wsSender.sendAudioBlock(leftIn, rightIn, numSamples);
}

bool S2DioAudioProcessor::hasEditor() const { return true; }

juce::AudioProcessorEditor* S2DioAudioProcessor::createEditor()
{
    return new S2DioAudioProcessorEditor(*this);
}

void S2DioAudioProcessor::getStateInformation(juce::MemoryBlock&) {}
void S2DioAudioProcessor::setStateInformation(const void*, int) {}

} // namespace s2dio

// Plugin Entry Point
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new s2dio::S2DioAudioProcessor();
}
