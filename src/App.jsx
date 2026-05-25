import GameCanvas from './components/GameCanvas.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <GameCanvas />
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto bg-ddak-cream/80 backdrop-blur-sm">
          <Footer />
        </div>
      </div>
    </>
  )
}
