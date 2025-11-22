export default function Navbar() {
    return (
        <nav className="bg-gray-900 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a href="/" className="text-2xl font-bold text-white">
                            VideoCaps
                        </a>
                    </div>

                    <div className="flex items-center space-x-4">
                        <a
                            href="/"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Live Captions
                        </a>
                        <a
                            href="/upload"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Upload
                        </a>
                        <a
                            href="#"
                            className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Docs
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
