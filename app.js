import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
const socket = io("http://localhost:3000");

export default function ChatRoom() {
  const [socketId, setSocketId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    // koneksi berhasil
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    // menerima welcome message dengan socket.id dari server
    socket.on("welcome", (data) => {
      console.log(" Welcome message:", data);
      setSocketId(data.socketId);
    });

    // menerima chat message dari server
    socket.on("chat message", (data) => {
      console.log("New message:", data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });
    return () => {
      // Cleanup: hapus semua event listeners saat unmount
      socket.off("connect");
      socket.off("welcome");
      socket.off("chat message");
      socket.off("disconnect");
    };
    // return () => {
    //   socket.disconnect(); // cleanup koneksi saat unmount
    // };
  }, []);

  // fungsi untuk mengirim pesan
  const sendMessage = (e) => {
    e.preventDefault();

    if (inputMessage.trim().toLowerCase().startsWith("/ai")) {
      const prompt = inputMessage.trim().substring(4);
      if (prompt) {
        socket.emit("/ask/ai", { prompt });
      } else {
        socket.emit("chat message", {
          message: inputMessage,
          user: localStorage.getItem("user"),
        });
      }

      setInputMessage("");
    }

    if (inputMessage.trim()) {
      socket.emit("chat message", inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Chat Room</h1>
      <p className="text-sm text-gray-500 mb-6">
        Socket ID:{" "}
        <span className="font-mono">{socketId || "Connecting..."}</span>
      </p>

      {/* Display messages */}
      <div className="border rounded-lg bg-gray-50 h-80 overflow-y-auto p-4 mb-6 shadow-sm">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-32">
            No messages yet.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.id === socketId ? "items-end" : "items-start"
              } mb-3`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 shadow ${
                  msg.id === socketId
                    ? "bg-green-100 text-gray-800"
                    : "bg-white text-gray-900"
                }`}
              >
                <span className="font-semibold text-gray-600">
                  {msg.id === socketId ? "You" : msg.id}
                </span>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.message}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
