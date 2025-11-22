export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
                <h1 className="text-4xl font-bold text-center mb-8">
                    VideoCaps
                </h1>
                <p className="text-center text-lg mb-4">
                    AI Real-Time Caption Generator
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                        Frontend is ready! Start building your real-time caption interface.
                    </p>
                </div>
            </div>
        </main>
    );
}
