#include "WebSocketSender.h"
#include <ixwebsocket/IXNetSystem.h>
#include <iostream>
#ifdef _WIN32
#include <windows.h>
#endif

namespace s2dio
{

WebSocketSender::WebSocketSender(int p)
    : port(p), server(p, "127.0.0.1")
{
    ix::initNetSystem();
}

WebSocketSender::~WebSocketSender()
{
    stop();
}

void WebSocketSender::start()
{
    if (running.load()) return;
    ix::initNetSystem();

    server.setOnConnectionCallback([this](std::weak_ptr<ix::WebSocket> webSocketWeak,
                                         std::shared_ptr<ix::ConnectionState> connectionState) {
        auto webSocket = webSocketWeak.lock();
        if (!webSocket) return;

        webSocket->setOnMessageCallback([this, connectionState](const ix::WebSocketMessagePtr& msg) {
            if (msg->type == ix::WebSocketMessageType::Open)
            {
                clientCount.fetch_add(1);
                std::cout << "[S2DIO VST3] Studio session connected from browser." << std::endl;
            }
            else if (msg->type == ix::WebSocketMessageType::Close || msg->type == ix::WebSocketMessageType::Error)
            {
                clientCount.fetch_sub(1);
                std::cout << "[S2DIO VST3] Studio session disconnected." << std::endl;
            }
        });
    });

    auto res = server.listen();
    if (res.first)
    {
        server.start();
        running.store(true);
#ifdef _WIN32
        OutputDebugStringA(("[S2DIO VST3] WebSocket Audio Server running on 127.0.0.1:" + std::to_string(port) + "\n").c_str());
#endif
        std::cout << "[S2DIO VST3] WebSocket Audio Server running on 127.0.0.1:" << port << std::endl;
    }
    else
    {
#ifdef _WIN32
        OutputDebugStringA(("[S2DIO VST3] Failed to bind port: " + res.second + "\n").c_str());
#endif
        std::cerr << "[S2DIO VST3] Failed to bind port: " << res.second << std::endl;
    }
}

void WebSocketSender::stop()
{
    if (!running.load()) return;
    server.stop();
    running.store(false);
}

bool WebSocketSender::isClientConnected() const
{
    return clientCount.load() > 0;
}

int WebSocketSender::getConnectedClientCount() const
{
    return clientCount.load();
}

void WebSocketSender::sendAudioBlock(const float* leftChannel, const float* rightChannel, int numSamples)
{
    if (!running.load() || clientCount.load() <= 0) return;

    std::lock_guard<std::mutex> lock(sendMutex);

    // Interleave left and right channels: [L0, R0, L1, R1, ...]
    const size_t totalFloats = static_cast<size_t>(numSamples) * 2;
    if (interleavedBuffer.size() < totalFloats)
    {
        interleavedBuffer.resize(totalFloats);
    }

    for (int i = 0; i < numSamples; ++i)
    {
        interleavedBuffer[i * 2] = leftChannel ? leftChannel[i] : 0.0f;
        interleavedBuffer[i * 2 + 1] = rightChannel ? rightChannel[i] : 0.0f;
    }

    const char* binaryData = reinterpret_cast<const char*>(interleavedBuffer.data());
    const size_t byteLength = totalFloats * sizeof(float);

    // Broadcast raw Float32 stereo binary buffer to all connected web clients
    for (auto& client : server.getClients())
    {
        if (client && client->getReadyState() == ix::ReadyState::Open)
        {
            client->sendBinary(std::string(binaryData, byteLength));
        }
    }
}

} // namespace s2dio
