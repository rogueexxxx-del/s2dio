cmake_minimum_required(VERSION 3.22)
project(S2DioAudioBridge VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE framework integration via FetchContent (clean zero-friction build)
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.4
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(JUCE)

# WebSocket streaming library (websocketpp or ixwebsocket header-only / lightweight)
FetchContent_Declare(
    ixwebsocket
    GIT_REPOSITORY https://github.com/machinezone/IXWebSocket.git
    GIT_TAG        v11.4.5
    GIT_SHALLOW    TRUE
)
set(USE_TLS OFF CACHE BOOL "" FORCE)
set(USE_ZLIB OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(ixwebsocket)

# Declare S2DIO VST3 Plugin
juce_add_plugin(S2DioBridge
    COMPANY_NAME "S2DIO"
    BUNDLE_ID "com.s2dio.bridge"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    PLUGIN_MANUFACTURER_CODE S2DI
    PLUGIN_CODE S2DB
    FORMATS VST3 AU Standalone
    PRODUCT_NAME "S2DIO Master Bridge"
)

target_sources(S2DioBridge
    PRIVATE
        src/PluginProcessor.cpp
        src/PluginProcessor.h
        src/PluginEditor.cpp
        src/PluginEditor.h
        src/WebSocketSender.cpp
        src/WebSocketSender.h
)

target_compile_definitions(S2DioBridge
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        S2DIO_BRIDGE_PORT=4949
)

target_link_libraries(S2DioBridge
    PRIVATE
        ixwebsocket
        juce::juce_audio_utils
        juce::juce_audio_processors
        juce::juce_gui_basics
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)
