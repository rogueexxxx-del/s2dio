#pragma once

#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <thread>
#include <ixwebsocket/IXWebSocketServer.h>

namespace s2dio
{

class WebSocketSender
{
public:
    WebSocketSender(int port = 4949);
    ~WebSocketSender();

    void start();
    void stop();
    bool isClientConnected() const;
    int getConnectedClientCount() const;

    // Send stereo Float32 interleaved PCM block directly to connected S2DIO room
    void sendAudioBlock(const float* leftChannel, const float* rightChannel, int numSamples);

private:
    int port;
    std::atomic<bool> running{false};
    std::atomic<int> clientCount{0};
    ix::WebSocketServer server;
    std::vector<float> interleavedBuffer;
    std::mutex sendMutex;
};

} // namespace s2dio
