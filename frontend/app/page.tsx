"use client";

export default function HomePage() {
  /* We will use this for login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      redirect("/homepage");
    }
  }, []);*/

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-white to-red-500 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 text-gray-800">
            🏀 NBA Visualizations
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome to your NBA dashboard!
          </p>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white">
            <p className="text-gray-700">
              Explore interactive charts and insights about your favorite NBA
              teams and players.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
