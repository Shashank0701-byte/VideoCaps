interface Caption {
    text: string;
    timestamp: number;
    language?: string;
}

interface LiveCaptionProps {
    captions: Caption[];
    isRecording: boolean;
}

export default function LiveCaption({ captions, isRecording }: LiveCaptionProps) {
    const latestCaption = captions[captions.length - 1];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Current Live Caption Display */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl p-8 mb-6 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                {/* Animated background effect */}
                {isRecording && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
                )}

                {/* Caption Text */}
                <div className="relative z-10 text-center">
                    {latestCaption ? (
                        <p className="text-3xl md:text-4xl font-semibold text-white leading-relaxed animate-fade-in">
                            {latestCaption.text}
                        </p>
                    ) : (
                        <p className="text-2xl text-gray-500 italic">
                            {isRecording
                                ? 'Listening...'
                                : 'Start recording to see live captions'}
                        </p>
                    )}
                </div>

                {/* Recording indicator */}
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-red-400 font-medium">LIVE</span>
                    </div>
                )}
            </div>

            {/* Caption History */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Caption History
                </h3>

                {captions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No captions yet. Start recording to see transcriptions.
                    </p>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {captions.map((caption, index) => (
                            <div
                                key={index}
                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 animate-slide-up"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                <p className="text-white text-base leading-relaxed mb-2">
                                    {caption.text}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        {new Date(caption.timestamp).toLocaleTimeString()}
                                    </span>
                                    {caption.language && (
                                        <span className="flex items-center gap-1">
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                                />
                                            </svg>
                                            {caption.language.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
        </div>
    );
}
